import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { DriverMap } from "../../components/DriverMap";
import { RideOfferCard } from "../../components/RideOfferCard";
import { ActiveTripCard } from "../../components/ActiveTripCard";
import { HomeStatusCard } from "../../components/HomeStatusCard";
import { StatusPill, type PillTone } from "../../components/StatusPill";
import { BrandMark } from "../../components/BrandMark";
import { Icon } from "../../components/Icon";
import { navSpace } from "../../components/DriverTabBar";
import { TripShareSheet } from "../../components/TripShareSheet";
import { onRecenter } from "../../navigation/map-recenter";
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
import { shareStrings, statusStrings } from "../../i18n/strings.phase7";
import { home75Strings } from "../../i18n/strings.phase75";
import {
  radius,
  shadows,
  spacing,
  touchTarget,
  usePalette,
} from "../../theme";

/**
 * The screen a driver looks at all day.
 *
 * PHASE 7 made it map-first. PHASE 7.5 finished the job: the only permanent
 * chrome is the brand mark and one status pill at the top, a floating status
 * card and the floating navigation at the bottom. Everything is inset from the
 * screen edges, nothing is glued to them, and the map is visible behind all of
 * it. The round map controls now carry real icons instead of glyph characters.
 *
 * What deliberately did NOT change: this screen is still never unmounted while
 * the driver is signed in, it still owns GPS publishing, socket status and the
 * trip lifecycle, and tracking still follows AVAILABILITY rather than the screen
 * lifecycle - a driver who is ONLINE must keep publishing `driver:location`
 * because MatchingService reads that position from Redis. Going OFFLINE stops
 * the GPS, which is the only honest way to stop draining the battery.
 *
 * PHASE 1 (R-8): the bottom navigation is no longer rendered here. It lived in
 * this screen with `active="map"` hardcoded, which meant it only existed on one
 * of its three sections. It is now mounted once in DriverNavigator so it
 * persists across Requests and Menu too. This screen keeps `navSpace()` because
 * its floating cards still have to clear that bar, and it subscribes to
 * `onRecenter` so the bar's centre item can still recentre the camera - that
 * follow flag is local state and stays local.
 *
 * PHASE 1 (R-11): the top bar was `flexDirection: "row-reverse"`, which
 * double-flipped now that real RTL is enabled, and the map control column was
 * pinned with `left`, which never mirrors. Now `"row"` and `end`.
 *
 * Performance: no state added that changes on a GPS fix. `fix` is read from the
 * store exactly as before, the palette comes from a memoised context, and the
 * cards below are the same memoised components.
 */
export function DriverHomeScreen() {
  const insets = useSafeAreaInsets();
  const palette = usePalette();
  const navigation =
    useNavigation<NativeStackNavigationProp<DriverStackParamList>>();

  useDriverProfile();
  const profile = useDriverStore((state) => state.profile);
  const fix = useLocationStore((state) => state.fix);

  const { availability, isOnline, onTrip, blocked, pending, error, toggle } =
    useAvailability();

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

  // The navigation leg for the map. The server decides which leg this is from
  // the trip status, so the line switches to the destination only after Start
  // Trip has actually been accepted by the backend.
  const activeRoute = useTripRoute(trip);

  // PHASE 4: unread messages and callability for the running trip, both read
  // from GET /trip-communication/:tripId. Nothing is decided locally.
  const {
    unreadCount,
    callablePhone,
    call: callPassenger,
    clearUnread,
  } = useTripCommunication(trip);

  const [shareOpen, setShareOpen] = useState(false);

  // SOS.
  //
  // `fix` is the last accepted GPS fix held by the location store. It can be
  // null when tracking is off, and the report still goes out without a
  // position: a report with no coordinates beats no report at all. Nothing here
  // is trusted by the server - the device sends a trip id, the server verifies
  // the trip belongs to this driver, stamps the time and stores the position.
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
   * Play policy requires the driver to be told what is collected and why BEFORE
   * the system dialog appears, and Android never re-prompts once a driver
   * refuses - so firing the system dialog cold would burn the only chance we
   * get. Declining is not an error: tracking stays foreground-only.
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
   * The bottom bar's centre item recentres the camera when the driver is
   * already on the map. The bar is mounted in DriverNavigator, outside this
   * screen, so it reaches the camera through this subscription.
   */
  useEffect(() => onRecenter(recenter), [recenter]);

  /**
   * Opens the trip chat with the passenger. The badge is dropped on the way in;
   * the authoritative receipt is still the chat screen's POST /messages/read.
   */
  const openChat = useCallback(() => {
    if (!trip) return;
    clearUnread();
    navigation.navigate("TripChat", { tripId: trip.id });
  }, [clearUnread, navigation, trip]);

  /**
   * Direct dial from the trip card. The number is never chosen here -
   * `callablePhone` is null unless the server returned canCall with a number,
   * so a HIDDEN phone policy removes the button instead of dialling a mask.
   */
  const dialPassenger = useCallback(() => {
    void callPassenger().then((ok) => {
      if (!ok) Alert.alert(strings.safety.errorTitle, strings.chat.callFailed);
    });
  }, [callPassenger]);

  // ---- derived display state ---------------------------------------------

  const availabilityTone: PillTone = onTrip
    ? "busy"
    : isOnline
      ? "approved"
      : "neutral";
  const availabilityShort = onTrip
    ? home75Strings.pillOnTrip
    : isOnline
      ? home75Strings.pillOnline
      : home75Strings.pillOffline;

  // The socket pill is only shown when there is something wrong: a green
  // "connected" chip next to a green "online" chip is noise, but a driver who is
  // online with a dead socket will never receive an offer and must be told.
  const linkBroken = link !== "connected";
  const linkLabel =
    link === "connecting" ? home75Strings.linkConnecting : home75Strings.linkDown;

  const vehicle = profile?.vehicle;
  const vehicleLine = vehicle?.plate
    ? [vehicle.make, vehicle.model].filter(Boolean).join(" ") +
      " \u00b7 " +
      vehicle.plate
    : strings.home.vehicleMissing;

  const permissionNotice =
    permission === "servicesOff"
      ? strings.home.permissionServicesOff
      : permission === "blocked"
        ? strings.home.permissionBlocked
        : permission === "denied"
          ? strings.home.permissionDenied
          : null;

  const statusLabel = onTrip
    ? statusStrings.onTrip
    : isOnline
      ? statusStrings.online
      : statusStrings.offline;
  const statusColor = onTrip
    ? palette.busy
    : isOnline
      ? palette.online
      : palette.offline;

  const hint = onTrip
    ? home75Strings.onTripHint
    : isOnline
      ? home75Strings.waiting
      : home75Strings.offlineHint;

  // Everything floating at the bottom clears the navigation pill, which is now
  // mounted by DriverNavigator rather than by this screen.
  const bottomInset = navSpace(insets.bottom);

  return (
    <View style={[styles.root, { backgroundColor: palette.background }]}>
      <DriverMap
        fix={fix}
        follow={follow}
        onPanByUser={onPanByUser}
        route={activeRoute}
        // PHASE 2: picks the marker artwork. The class is the one staff approved
        // on the vehicle, so an unapproved or missing vehicle falls back to the
        // car marker rather than blocking the map.
        rideClass={vehicle?.rideClass ?? null}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <BrandMark />
        <View style={styles.topPills}>
          <StatusPill label={availabilityShort} tone={availabilityTone} dot />
          {linkBroken ? (
            <StatusPill
              label={linkLabel}
              tone={link === "connecting" ? "pending" : "rejected"}
              dot
            />
          ) : null}
        </View>
      </View>

      {/* Map controls, one column, clear of the cards. */}
      <View style={[styles.controls, { bottom: bottomInset + 132 }]}>
        {trip ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={shareStrings.open}
            onPress={() => setShareOpen(true)}
            style={({ pressed }) => [
              styles.roundButton,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
              },
              pressed ? { backgroundColor: palette.surfaceRaised } : null,
            ]}
          >
            <Icon name="share" size={22} color={palette.primaryText} />
          </Pressable>
        ) : null}

        {!follow ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={home75Strings.recenter}
            onPress={recenter}
            style={({ pressed }) => [
              styles.roundButton,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
              },
              pressed ? { backgroundColor: palette.surfaceRaised } : null,
            ]}
          >
            <Icon name="target" size={22} color={palette.primaryText} />
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
        <HomeStatusCard
          availability={availability}
          statusLabel={statusLabel}
          statusColor={statusColor}
          vehicleLine={vehicleLine}
          hint={hint}
          warning={permissionNotice ?? (blocked ? strings.home.notApproved : notice)}
          error={error}
          pending={pending}
          blocked={blocked}
          bottom={bottomInset}
          labels={{
            goOnline: home75Strings.startReceiving,
            goOffline: home75Strings.stopReceiving,
            onTrip: home75Strings.onTripLocked,
          }}
          onToggle={() => void toggle()}
          onWarningPress={
            permissionNotice ? () => void Linking.openSettings() : undefined
          }
        />
      )}

      <TripShareSheet
        visible={shareOpen}
        tripId={trip?.id ?? null}
        onClose={() => setShareOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  topBar: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    // Plain "row": React Native mirrors it under RTL, so the brand mark leads
    // and the pills trail in every language. See the R-11 note above.
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  topPills: { alignItems: "flex-end", gap: spacing.xs },

  controls: {
    position: "absolute",
    // `end`, not `left`: the control column belongs on the trailing edge, which
    // mirrors with the layout. `left` would stay put in both directions.
    end: spacing.lg,
    gap: spacing.sm,
  },
  roundButton: {
    width: touchTarget.normal,
    height: touchTarget.normal,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.floating,
  },
});
