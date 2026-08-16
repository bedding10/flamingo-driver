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
import { useAvailability } from "../../hooks/useAvailability";
import { useRideOffer } from "../../hooks/useRideOffer";
import { useTripLifecycle } from "../../hooks/useTripLifecycle";
import { useTripRoute } from "../../hooks/useTripRoute";
import { useTripCommunication } from "../../hooks/useTripCommunication";
import { useDriverProfile } from "../../hooks/useDriverProfile";
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
import { requestStrings } from "../../i18n/strings.requests";
import { menuStrings } from "../../i18n/strings.menu";
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
 * Three things are wired here and nothing else: the map, the availability
 * switch and GPS publishing. Ride offers arrive on this same screen in the next
 * phase; the layout already reserves the bottom sheet area for the offer card
 * so adding it will not move the toggle the driver has learned to reach for.
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
   * ActiveTripCard declares `onChat` as REQUIRED and this screen never passed
   * it, so the TripChat route registered in DriverNavigator was unreachable:
   * the driver had no way at all to answer a passenger message. The id comes
   * from the running trip rather than a store read, matching the route param
   * contract in navigation/types.ts.
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
        {/*
          PHASE 5: the hamburger opens the menu, not the profile form. It used to
          navigate straight to Profile, which made the wallet, the earnings and
          the sign-out unreachable and turned a settings form into the app's
          only side door.
        */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={menuStrings.title}
          onPress={() => navigation.navigate("Menu")}
          style={styles.roundButton}
        >
          <Text style={styles.roundButtonGlyph}>{"\u2261"}</Text>
        </Pressable>

        <StatusPill label={linkLabel} tone={linkTone} />

        <View style={styles.topActions}>
          {/*
            PHASE 3: the only entry point to the bidding requests list. It is
            shown always (not only when ONLINE) so the driver can read why the
            list is empty instead of hunting for a hidden button.
          */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={requestStrings.title}
            onPress={() => navigation.navigate("Requests")}
            style={styles.roundButton}
          >
            <Text style={styles.roundButtonGlyph}>{"\u25ce"}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={strings.approval.openDocuments}
            onPress={() => navigation.navigate("Documents")}
            style={styles.roundButton}
          >
            <Text style={styles.roundButtonGlyph}>{"\u25a4"}</Text>
          </Pressable>
        </View>
      </View>

      {!follow ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={strings.home.recenter}
          onPress={recenter}
          style={[styles.recenter, { bottom: insets.bottom + 220 }]}
        >
          <Text style={styles.roundButtonGlyph}>{"\u2316"}</Text>
        </Pressable>
      ) : null}

      {trip ? (
        <ActiveTripCard
          trip={trip}
          nextStatus={nextStatus}
          pending={tripPending}
          error={tripError}
          bottomInset={insets.bottom}
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
          bottomInset={insets.bottom}
          onAccept={accept}
          onDecline={decline}
        />
      ) : (
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xl }]}>
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

        {/*
          PHASE 3: a second, secondary way into the requests list from the
          sheet the driver already reads while idle.
        */}
        {isOnline && !onTrip ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={requestStrings.title}
            onPress={() => navigation.navigate("Requests")}
            style={styles.requestsLink}
          >
            <Text style={styles.requestsLinkLabel}>
              {requestStrings.title}
            </Text>
          </Pressable>
        ) : null}

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
  topActions: {
    flexDirection: "row-reverse",
    alignItems: "center",
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

  recenter: {
    position: "absolute",
    left: spacing.lg,
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
    ...shadows.floating,
  },
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
  requestsLink: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: withAlpha(colors.white, 0.06),
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  requestsLinkLabel: { ...typography.subtitle, color: colors.gold },
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
