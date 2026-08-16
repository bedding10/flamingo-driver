import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { DriverMap } from "../../components/DriverMap";
import { OnlineToggle } from "../../components/OnlineToggle";
import { RideOfferCard } from "../../components/RideOfferCard";
import { ActiveTripCard } from "../../components/ActiveTripCard";
import { StatusPill, type PillTone } from "../../components/StatusPill";
import { BrandMark } from "../../components/BrandMark";
import { DriverTabBar, TAB_BAR_HEIGHT } from "../../components/DriverTabBar";
import { TripShareSheet } from "../../components/TripShareSheet";
import { useAvailability } from "../../hooks/useAvailability";
import { useRideOffer } from "../../hooks/useRideOffer";
import { useTripLifecycle } from "../../hooks/useTripLifecycle";
import { useTripRoute } from "../../hooks/useTripRoute";
import { useTripCommunication } from "../../hooks/useTripCommunication";
import { useDriverProfile } from "../../hooks/useDriverProfile";
import { useUnreadNotificationCount } from "../../hooks/useNotifications";
import { useDriverStore } from "../../stores/driver.store";
import { useLocationStore } from "../../stores/location.store";
import {
  startLocationTracking,
  stopLocationTracking,
  type LocationPermissionResult,
} from "../../services/location.service";
import { safetyApi } from "../../api";
import { connectSocket, onSocketStatus } from "../../socket/socket.service";
import type { SocketStatus } from "../../types/socket";
import type { DriverStackParamList } from "../../navigation/types";
import { strings } from "../../i18n/strings";
import { shareStrings, statusStrings, tabStrings } from "../../i18n/strings.phase7";
import {
  colors,
  radius,
  spacing,
  touchTarget,
  typography,
  withAlpha,
  shadows,
} from "../../theme";

/**
 * The screen a driver looks at all day.
 *
 * PHASE 7 made it map-first in the literal sense: the map fills the screen, the
 * chrome floats on top of it, and the only permanent UI is a three-item bottom
 * bar - requests | map | menu - with the map in the middle because the map is
 * home. The old top-right cluster of round glyph buttons is gone; documents and
 * everything else now live in the menu, where they are labelled instead of
 * being guessed from a symbol.
 *
 * This screen is still never unmounted while the driver is signed in. It owns
 * GPS publishing, the socket status and the trip lifecycle, which is why the
 * bottom bar pushes other routes on top instead of being a tab navigator that
 * would tear this screen down exactly when an offer arrives.
 *
 * Tracking follows availability, not the screen lifecycle: a driver who is
 * ONLINE must keep publishing `driver:location` because MatchingService reads
 * that position from Redis to pick a driver. Going OFFLINE stops the GPS, which
 * is also the only honest way to stop draining the battery.
 */
export function DriverHomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<DriverStackParamList>>();

  useDriverProfile();
  const profile = useDriverStore((state) => state.profile);
  const fix = useLocationStore((state) => state.fix);

  const availabilityState = useAvailability();
  const { availability, isOnline, onTrip, blocked, pending, error, toggle } =
    availabilityState;

  // Offers are owned by their own hook so this screen stays a layout, not a
  // protocol handler.
  const { offer, awaiting, notice, accept, decline } = useRideOffer();
  const {
    trip,
    nextStatus,
    pending: tripPending,
    error: tripError,
    advance,
    cancel: cancelTripNow,
  } = useTripLifecycle();

  // The navigation leg for the map. The server picks which leg this is from
  // the trip status, so the line switches to the destination only after
  // Start Trip has actually been accepted by the backend.
  const activeRoute = useTripRoute(trip);

  // PHASE 4: unread messages and callability for the running trip, both read
  // from GET /trip-communication/:tripId. Nothing is decided locally.
  const {
    unreadCount,
    callablePhone,
    call: callPassenger,
    clearUnread,
  } = useTripCommunication(trip);

  // PHASE 7: unread notifications for the bottom bar badge. It reads the same
  // react-query cache the inbox fills, so opening the map costs no request.
  const unreadNotifications = useUnreadNotificationCount();

  // PHASE 7: the trip sharing sheet (POST /safety/share).
  const [shareOpen, setShareOpen] = useState(false);

  // SOS.
  //
  // `fix` is the last accepted GPS fix held by the location store. It can be
  // null when tracking is off, and the report still goes out without a
  // position: a report with no coordinates beats no report at all.
  //
  // Nothing here is trusted by the server. The device sends a trip id; the
  // server is what verifies that trip belongs to this driver, stamps the time
  // and stores the position.
  const [sosPending, setSosPending] = useState(false);
  const raiseSos = useCallback(async () => {
    if (sosPending) return;
    setSosPending(true);
    try {
      await safetyApi.reportSos({
        tripId: trip?.id,
        lat: fix?.lat,
        lng: fix?.lng,
        type: "SOS",
      });
      Alert.alert(strings.safety.sentTitle, strings.safety.sentBody);
    } catch {
      Alert.alert(strings.safety.errorTitle, strings.safety.errorBody);
    } finally {
      setSosPending(false);
    }
  }, [sosPending, trip, fix]);

  const [link, setLink] = useState<SocketStatus>("idle");
  const [permission, setPermission] = useState<LocationPermissionResult | null>(
    null,
  );
  const [follow, setFollow] = useState(true);

  // Guards the tracking effect against a re-render restarting the GPS: the
  // service is idempotent per mode, and this keeps the effect from even calling
  // it when nothing changed.
  const trackingModeRef = useRef<"idle" | "trip" | null>(null);

  /**
   * The background-location disclosure, shown before the OS prompt.
   *
   * Play policy requires the driver to be told what is collected and why
   * BEFORE the system dialog appears, and Android never re-prompts once a
   * driver refuses - so firing the system dialog cold would burn the only
   * chance we get. Declining is not an error: tracking simply stays
   * foreground-only, exactly as it behaved before.
   */
  const discloseBackground = useCallback(
    () =>
      new Promise<boolean>((resolve) => {
        Alert.alert(
          strings.tracking.disclosureTitle,
          strings.tracking.disclosureBody,
          [
            {
              text: strings.tracking.disclosureDecline,
              style: "cancel",
              onPress: () => resolve(false),
            },
            {
              text: strings.tracking.disclosureAccept,
              onPress: () => resolve(true),
            },
          ],
          { cancelable: false },
        );
      }),
    [],
  );

  useEffect(() => {
    // The socket is session-owned and already open after login; this only
    // guarantees it on a cold resume into this screen.
    connectSocket();
    return onSocketStatus(setLink);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const desired = onTrip ? "trip" : isOnline ? "idle" : null;

    if (desired === null) {
      trackingModeRef.current = null;
      void stopLocationTracking();
      return;
    }
    if (trackingModeRef.current === desired) return;

    trackingModeRef.current = desired;
    void startLocationTracking(desired, {
      disclose: discloseBackground,
    }).then((result) => {
      if (!cancelled) setPermission(result);
    });

    return () => {
      cancelled = true;
    };
  }, [isOnline, onTrip, discloseBackground]);

  // Leaving the signed-in stack entirely (sign-out) must not leave the GPS on.
  useEffect(() => {
    return () => {
      trackingModeRef.current = null;
      void stopLocationTracking();
    };
  }, []);

  const recenter = useCallback(() => setFollow(true), []);
  const onPanByUser = useCallback(() => setFollow(false), []);

  /**
   * Opens the trip chat with the passenger.
   *
   * PHASE 4: the badge is dropped on the way in. The authoritative receipt is
   * still the chat screen's POST /messages/read; this only stops the card from
   * showing a count for a thread the driver is currently reading.
   */
  const openChat = useCallback(() => {
    if (!trip) return;
    clearUnread();
    navigation.navigate("TripChat", { tripId: trip.id });
  }, [clearUnread, navigation, trip]);

  /**
   * PHASE 4: direct dial from the trip card.
   *
   * The number is never chosen here - `callablePhone` is null unless the server
   * returned canCall together with a number, so a HIDDEN phone policy simply
   * removes the button instead of dialling something masked.
   */
  const dialPassenger = useCallback(() => {
    void callPassenger().then((ok) => {
      if (!ok) Alert.alert(strings.safety.errorTitle, strings.chat.callFailed);
    });
  }, [callPassenger]);

  /** Bottom bar handler. The centre item recentres instead of navigating. */
  const onTab = useCallback(
    (tab: "requests" | "map" | "menu") => {
      if (tab === "requests") navigation.navigate("Requests");
      else if (tab === "menu") navigation.navigate("Menu");
      else recenter();
    },
    [navigation, recenter],
  );

  const linkTone: PillTone =
    link === "connected" ? "approved" : link === "connecting" ? "pending" : "rejected";
  const linkLabel =
    link === "connected"
      ? strings.home.linkConnected
      : link === "connecting"
        ? strings.home.linkConnecting
        : strings.home.linkDown;

  const vehicle = profile?.vehicle;
  const vehicleLine = vehicle?.plate
    ? [vehicle.make, vehicle.model].filter(Boolean).join(" ") + " \u00b7 " + vehicle.plate
    : strings.home.vehicleMissing;

  const permissionNotice =
    permission === "servicesOff"
      ? strings.home.permissionServicesOff
      : permission === "blocked"
        ? strings.home.permissionBlocked
        : permission === "denied"
          ? strings.home.permissionDenied
          : null;

  // Everything that floats at the bottom must clear the tab bar.
  const bottomInset = insets.bottom + TAB_BAR_HEIGHT;

  const statusLabel = onTrip
    ? statusStrings.onTrip
    : isOnline
      ? statusStrings.online
      : statusStrings.offline;
  const statusColor = onTrip
    ? colors.routeActive
    : isOnline
      ? colors.online
      : colors.offline;

  return (
    <View style={styles.root}>
      <DriverMap
        fix={fix}
        follow={follow}
        onPanByUser={onPanByUser}
        route={activeRoute}
        // PHASE 2: picks the marker artwork. The class is the one staff approved
        // on the vehicle, so an unapproved or missing vehicle simply falls back
        // to the car marker rather than blocking the map.
        rideClass={vehicle?.rideClass ?? null}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <BrandMark />
        <StatusPill label={linkLabel} tone={linkTone} />
      </View>

      {/* Map controls, stacked in one column so they never fight the cards. */}
      <View style={[styles.controls, { bottom: bottomInset + 200 }]}>
        {trip ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={shareStrings.open}
            onPress={() => setShareOpen(true)}
            style={styles.roundButton}
          >
            <Text style={styles.roundButtonGlyph}>{"\u21AA"}</Text>
          </Pressable>
        ) : null}

        {!follow ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={strings.home.recenter}
            onPress={recenter}
            style={styles.roundButton}
          >
            <Text style={styles.roundButtonGlyph}>{"\u2316"}</Text>
          </Pressable>
        ) : null}
      </View>

      {trip ? (
        <ActiveTripCard
          trip={trip}
          nextStatus={nextStatus}
          pending={tripPending}
          error={tripError}
          bottomInset={bottomInset}
          onAdvance={() => void advance()}
          onCancel={() => void cancelTripNow()}
          onSos={() => void raiseSos()}
          onChat={openChat}
          onCall={callablePhone ? dialPassenger : undefined}
          unreadCount={unreadCount}
        />
      ) : offer ? (
        <RideOfferCard
          offer={offer}
          awaiting={awaiting}
          notice={notice}
          bottomInset={bottomInset}
          onAccept={accept}
          onDecline={decline}
        />
      ) : (
        <View
          style={[styles.sheet, { paddingBottom: bottomInset + spacing.lg }]}
        >
          {/*
            PHASE 7: the availability state is spelled out, not implied by the
            colour of a switch. A driver must never have to guess whether the
            phone is actually receiving requests.
          */}
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusLabel, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>

          <Text style={styles.vehicle} numberOfLines={1}>
            {vehicleLine}
          </Text>

          <Text style={styles.hint} numberOfLines={2}>
            {onTrip
              ? strings.home.onTripHint
              : isOnline
                ? strings.home.onlineHint
                : strings.home.offlineHint}
          </Text>

          {permissionNotice ? (
            <Pressable
              onPress={() => void Linking.openSettings()}
              style={styles.notice}
            >
              <Text style={styles.noticeText}>{permissionNotice}</Text>
            </Pressable>
          ) : null}

          {blocked ? (
            <Text style={styles.blocked}>{strings.home.notApproved}</Text>
          ) : null}

          {notice ? <Text style={styles.blocked}>{notice}</Text> : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <OnlineToggle
            availability={availability}
            pending={pending}
            blocked={blocked}
            onToggle={() => void toggle()}
            labels={{
              goOnline: strings.home.goOnline,
              goOffline: strings.home.goOffline,
              onTrip: strings.home.onTripLabel,
            }}
          />
        </View>
      )}

      <DriverTabBar
        active="map"
        bottomInset={insets.bottom}
        labels={tabStrings}
        badge={unreadNotifications}
        onSelect={onTab}
      />

      <TripShareSheet
        visible={shareOpen}
        tripId={trip?.id ?? null}
        onClose={() => setShareOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },

  topBar: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },

  controls: {
    position: "absolute",
    left: spacing.lg,
    gap: spacing.sm,
  },
  roundButton: {
    width: touchTarget.normal,
    height: touchTarget.normal,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.floating,
  },
  roundButtonGlyph: {
    ...typography.title,
    color: colors.gold,
    lineHeight: 28,
  },

  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surfaceDark,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderTopWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.md,
    ...shadows.sheet,
  },
  statusRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.sm,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { ...typography.subtitle, writingDirection: "rtl" },
  vehicle: {
    ...typography.subtitle,
    color: colors.textOnDark,
    textAlign: "right",
    writingDirection: "rtl",
  },
  hint: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    textAlign: "right",
    writingDirection: "rtl",
  },
  notice: {
    backgroundColor: withAlpha(colors.warning, 0.14),
    borderColor: withAlpha(colors.warning, 0.45),
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  noticeText: {
    ...typography.caption,
    color: colors.warning,
    textAlign: "right",
    writingDirection: "rtl",
  },
  blocked: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    textAlign: "right",
    writingDirection: "rtl",
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    textAlign: "right",
    writingDirection: "rtl",
  },
});
