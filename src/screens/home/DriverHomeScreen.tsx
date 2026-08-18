import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { DriverMap } from "../../components/DriverMap";
import { RideOfferCard } from "../../components/RideOfferCard";
import { ActiveTripCard } from "../../components/ActiveTripCard";
import { HomeStatusCard } from "../../components/HomeStatusCard";
import { StatusPill } from "../../components/StatusPill";
import { DriverTopBar, toDriverLevel } from "../../components/DriverTopBar";
import { Icon } from "../../components/Icon";
import { DriverTabBar, navSpace } from "../../components/DriverTabBar";
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
import { home75Strings } from "../../i18n/strings.phase75";
import {
  iconSize,
  radius,
  shadows,
  spacing,
  touchTarget,
  usePalette,
} from "../../theme";

/**
 * The screen a driver looks at all day.
 *
 * STITCH FIDELITY PASS
 * The owner's verdict was that the app did not resemble the reference at all, so
 * the chrome on this screen is now the reference chrome, element for element,
 * from `main_driver_map`:
 *
 *   - the header is one floating row: tier-ringed avatar, a single glass status
 *     pill carrying the dot and the city, and a round notifications button. It
 *     replaces a brand mark plus two stacked pills, which was the biggest
 *     visible difference between this screen and the reference.
 *   - `my_location` is always present, on the trailing side, 56px, drawn on
 *     `surface-container-highest` with a `surface-variant` border - NOT pink.
 *     The reference reserves pink for the primary action.
 *   - the navigation is attached to the bottom edge again (see DriverTabBar).
 *
 * WHAT IS STILL NOT THE REFERENCE, DELIBERATELY:
 *   - `main_driver_map` shows no bottom card at all, because it only illustrates
 *     the ONLINE state. A driver still has to be able to go online, see why they
 *     cannot, and read a permission failure, so HomeStatusCard stays. It is the
 *     one element on this screen with no reference counterpart.
 *   - the socket pill has no counterpart either. It appears only when the socket
 *     is down, because an online driver with a dead socket will never receive an
 *     offer and must be told.
 *
 * What deliberately did NOT change: this screen is still never unmounted while
 * the driver is signed in, it still owns GPS publishing, socket status and the
 * trip lifecycle, and tracking still follows AVAILABILITY rather than the screen
 * lifecycle - a driver who is ONLINE must keep publishing `driver:location`
 * because MatchingService reads that position from Redis. Going OFFLINE stops
 * the GPS, which is the only honest way to stop draining the battery.
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

  // Unread notifications for the header button and the navigation badge. Reads
  // the same react-query cache the inbox fills, so opening the map costs no
  // request.
  const unreadNotifications = useUnreadNotificationCount();

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

  const openProfile = useCallback(
    () => navigation.navigate("ProfileHub"),
    [navigation],
  );
  const openNotifications = useCallback(
    () => navigation.navigate("Notifications"),
    [navigation],
  );

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

  /** Navigation handler. The centre item recentres instead of navigating. */
  const onTab = useCallback(
    (tab: "requests" | "map" | "menu") => {
      if (tab === "requests") navigation.navigate("Requests");
      else if (tab === "menu") navigation.navigate("Menu");
      else recenter();
    },
    [navigation, recenter],
  );

  // ---- derived display state ---------------------------------------------

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

  // Everything floating at the bottom clears the navigation bar.
  const bottomInset = navSpace(insets.bottom);
  // The reference puts the socket pill nowhere, so it goes directly under the
  // header: header padding + the 48px button row + one step.
  const headerHeight =
    Math.max(spacing["3xl"], insets.top + spacing.sm) +
    touchTarget.stitchMin +
    spacing.sm;

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

      <DriverTopBar
        name={profile?.name ?? ""}
        photoUrl={profile?.photoUrl}
        level={toDriverLevel(profile?.profileLevel)}
        statusLabel={availabilityShort}
        statusColor={statusColor}
        cityLabel={profile?.city}
        badge={unreadNotifications}
        topInset={insets.top}
        onProfile={openProfile}
        onNotifications={openNotifications}
      />

      {linkBroken ? (
        <View style={[styles.linkPill, { top: headerHeight }]} pointerEvents="none">
          <StatusPill
            label={linkLabel}
            tone={link === "connecting" ? "pending" : "rejected"}
            dot
          />
        </View>
      ) : null}

      {/*
        Map controls. The reference draws `my_location` on the trailing side, one
        column, always present, clear of the cards.
      */}
      <View style={[styles.controls, { bottom: bottomInset + spacing.md }]}>
        {trip ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={shareStrings.open}
            onPress={() => setShareOpen(true)}
            style={({ pressed }) => [
              styles.roundButton,
              {
                backgroundColor: palette.surfaceHighest,
                borderColor: palette.surfaceVariant,
              },
              pressed ? { backgroundColor: palette.surfaceBright } : null,
            ]}
          >
            <Icon name="share" size={iconSize.lg} color={palette.primaryText} />
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={home75Strings.recenter}
          onPress={recenter}
          style={({ pressed }) => [
            styles.roundButton,
            {
              backgroundColor: palette.surfaceHighest,
              borderColor: palette.surfaceVariant,
            },
            pressed ? { backgroundColor: palette.surfaceBright } : null,
          ]}
        >
          <Icon
            name="myLocation"
            size={iconSize.lg}
            color={palette.primaryText}
          />
        </Pressable>
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
  root: { flex: 1 },

  linkPill: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },

  controls: {
    position: "absolute",
    right: spacing.lg,
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
