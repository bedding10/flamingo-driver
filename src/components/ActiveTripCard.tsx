import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { textAlignStart } from "../i18n";
import { strings } from "../i18n/strings";
import {
  alpha,
  COLORS,
  ICON_SIZE,
  RADIUS,
  SEMANTIC,
  SHADOW_SHEET,
  SPACING,
  TOUCH_TARGET,
  typo,
} from "../theme/tokens";
import type { Trip, TripStatus } from "../types/trip";
import { RankAvatar } from "../ui";

type Props = {
  trip: Trip;
  nextStatus: TripStatus | null;
  pending: boolean;
  error: string | null;
  bottomInset: number;
  onAdvance: () => void;
  onCancel: () => void;
  /** Opens the trip chat with the passenger. */
  onChat: () => void;
  /**
   * Dials the passenger. Passed only when the server actually authorised a
   * number for this trip; absent otherwise, and the button is then not drawn at
   * all rather than drawn dead.
   */
  onCall?: () => void;
  /** Passenger messages this driver has not opened yet. */
  unreadCount?: number;
};

/** Icon-only contact buttons, per the request: two circles, no labels. */
const CONTACT_BUTTON = 48;

// Display labels only. The level itself is decided by the backend; this card
// never compares a trip count against a threshold.
const LEVEL_LABELS: Record<string, string> = {
  BRONZE: strings.level.bronze,
  SILVER: strings.level.silver,
  GOLD: strings.level.gold,
  DIAMOND: strings.level.diamond,
  LEGENDARY: strings.level.legendary,
};

function statusLabel(status: TripStatus): string {
  if (status === "ACCEPTED") return strings.trip.statusAccepted;
  if (status === "ARRIVING") return strings.trip.statusArriving;
  if (status === "IN_PROGRESS") return strings.trip.statusInProgress;
  return status;
}

function actionLabel(next: TripStatus | null): string | null {
  if (next === "ARRIVING") return strings.trip.actionArrived;
  if (next === "IN_PROGRESS") return strings.trip.actionStart;
  if (next === "COMPLETED") return strings.trip.actionComplete;
  return null;
}

/**
 * The card shown while a ride is running - Stitch `active_trip`.
 *
 * The address on display is always the one that matters next: before pickup it
 * is where the passenger waits, after pickup it is where they are going. Two
 * addresses at once is how a driver reads the wrong one at a junction.
 *
 * SOS REMOVED: the emergency button, its confirmation and the `onSos` prop are
 * gone by request, together with the rest of the SOS system. The trip state
 * machine and both confirmations (complete, cancel) are untouched.
 *
 * CONTACT: calling and messaging are now two equal circular icon buttons with
 * no text, sitting side by side at the end of the passenger row. The call
 * button appears only when `onCall` was passed, which the screen does only
 * after GET /trip-communication/:tripId returned canCall AND a number - the
 * card still holds no phone number of its own, since /driver/me/trips keeps
 * returning the passenger phone masked.
 *
 * Every row is plain `"row"`: React Native mirrors it under RTL.
 */
function ActiveTripCardComponent({
  trip,
  nextStatus,
  pending,
  error,
  bottomInset,
  onAdvance,
  onCancel,
  onChat,
  onCall,
  unreadCount = 0,
}: Props) {
  const status = trip.status;
  const heading = statusLabel(status);
  const primary = actionLabel(nextStatus);
  const enRoute = status === "IN_PROGRESS";
  const address = enRoute
    ? trip.destAddress || strings.offer.unknownAddress
    : trip.pickupAddress || strings.offer.unknownAddress;

  // Completing pays the driver and closes the ride; cancelling counts against
  // them. Both are irreversible (COMPLETED and CANCELLED have no exit in the
  // server state machine), so both ask first.
  const confirmAdvance = () => {
    if (nextStatus !== "COMPLETED") {
      onAdvance();
      return;
    }
    Alert.alert(
      strings.trip.completeConfirmTitle,
      strings.trip.completeConfirmBody,
      [
        { text: strings.trip.back, style: "cancel" },
        { text: strings.trip.confirm, onPress: onAdvance },
      ],
    );
  };

  const confirmCancel = () => {
    Alert.alert(strings.trip.cancelConfirmTitle, strings.trip.cancelConfirmBody, [
      { text: strings.trip.back, style: "cancel" },
      { text: strings.trip.cancel, style: "destructive", onPress: onCancel },
    ]);
  };

  return (
    <View style={[styles.sheet, { paddingBottom: bottomInset + SPACING.xl }]}>
      <View style={styles.handle} />

      <View style={styles.headRow}>
        <Text style={styles.heading}>{heading}</Text>
        {trip.fare != null ? (
          <Text style={styles.fare}>
            {Math.round(trip.fare) + (trip.currency ? " " + trip.currency : "")}
          </Text>
        ) : null}
      </View>

      <View style={styles.leg}>
        <View
          style={[styles.dot, enRoute ? styles.dotDrop : styles.dotPickup]}
        />
        <View style={styles.legText}>
          <Text style={styles.legLabel}>
            {enRoute ? strings.offer.dropoff : strings.offer.pickup}
          </Text>
          <Text style={styles.legValue} numberOfLines={2}>
            {address}
          </Text>
        </View>
      </View>

      {/* Passenger identity, then the two icon-only ways to reach them. */}
      <View style={styles.contactRow}>
        <RankAvatar
          size={44}
          avatarUrl={trip.passenger?.avatarUrl}
          tier={trip.passenger?.profileLevel}
          fallback={trip.passenger?.name ?? null}
          rating={trip.passenger?.rating ?? null}
        />
        <View style={styles.passengerBlock}>
          <Text style={styles.passenger} numberOfLines={1}>
            {trip.passenger?.name || strings.offer.passengerFallback}
          </Text>
          {trip.passenger?.profileLevel ? (
            <Text style={styles.passengerLevel} numberOfLines={1}>
              {(LEVEL_LABELS[trip.passenger.profileLevel] ??
                trip.passenger.profileLevel) +
                (trip.passenger.completedTripsCount != null
                  ? ` \u00b7 ${trip.passenger.completedTripsCount} ${strings.level.tripsShort}`
                  : "")}
            </Text>
          ) : null}
        </View>

        {onCall ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={strings.chat.call}
            onPress={onCall}
            style={({ pressed }) => [
              styles.contactButton,
              pressed ? styles.pressed : null,
            ]}
          >
            <MaterialIcons
              name="call"
              size={ICON_SIZE.lg}
              color={COLORS.primary}
            />
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={strings.chat.openChat}
          onPress={onChat}
          style={({ pressed }) => [
            styles.contactButton,
            pressed ? styles.pressed : null,
          ]}
        >
          <MaterialIcons
            name="chat-bubble"
            size={ICON_SIZE.lg}
            color={COLORS.primary}
          />
          {unreadCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? "9+" : String(unreadCount)}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={strings.trip.cancel}
          disabled={pending}
          onPress={confirmCancel}
          style={({ pressed }) => [
            styles.cancelButton,
            pressed ? styles.pressed : null,
            pending ? styles.disabled : null,
          ]}
        >
          <Text style={styles.cancelLabel}>{strings.trip.cancel}</Text>
        </Pressable>

        {primary ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={primary}
            disabled={pending}
            onPress={confirmAdvance}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed ? styles.pressed : null,
              pending ? styles.disabled : null,
            ]}
          >
            <Text style={styles.primaryLabel}>{primary}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export const ActiveTripCard = React.memo(ActiveTripCardComponent);

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    // Symmetric: identical on both sides, so there is nothing to mirror.
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.surfaceContainer,
    borderTopLeftRadius: RADIUS.card,
    borderTopRightRadius: RADIUS.card,
    borderTopWidth: 1,
    borderColor: COLORS.surfaceVariant,
    paddingHorizontal: SPACING.container,
    paddingTop: SPACING.md,
    gap: SPACING.md,
    ...SHADOW_SHEET,
  },
  handle: {
    alignSelf: "center",
    width: 48,
    height: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceVariant,
    marginBottom: SPACING.sm,
  },
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heading: {
    ...typo("titleMd"),
    color: COLORS.onSurface,
    textAlign: textAlignStart(),
  },
  /** Money is green, per the design system's fare colour. */
  fare: { ...typo("titleMd"), color: SEMANTIC.success },

  leg: { flexDirection: "row", alignItems: "flex-start", gap: SPACING.md },
  dot: { width: 10, height: 10, borderRadius: RADIUS.full, marginTop: 6 },
  dotPickup: { backgroundColor: SEMANTIC.success },
  /** Destination markers are the tertiary light blue in this design system. */
  dotDrop: { backgroundColor: COLORS.tertiary },
  legText: { flex: 1, gap: 2 },
  legLabel: {
    ...typo("labelSm"),
    color: COLORS.onSurfaceVariant,
    textAlign: textAlignStart(),
  },
  legValue: {
    ...typo("bodyMd"),
    color: COLORS.onSurface,
    textAlign: textAlignStart(),
  },

  contactRow: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  passengerBlock: { flex: 1, gap: 2 },
  passenger: {
    ...typo("labelMd"),
    color: COLORS.onSurface,
    textAlign: textAlignStart(),
  },
  passengerLevel: {
    ...typo("labelSm"),
    color: COLORS.primary,
    textAlign: textAlignStart(),
  },
  /** Both contact buttons are identical: neither outranks the other. */
  contactButton: {
    width: CONTACT_BUTTON,
    height: CONTACT_BUTTON,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: alpha(COLORS.primaryContainer, 0.5),
    backgroundColor: alpha(COLORS.primaryContainer, 0.16),
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    ...typo("labelSm"),
    color: COLORS.onPrimaryContainer,
    lineHeight: 16,
  },
  error: {
    ...typo("labelSm"),
    color: COLORS.error,
    textAlign: textAlignStart(),
  },

  actions: { flexDirection: "row", gap: SPACING.md },
  primaryButton: {
    flex: 2,
    minHeight: TOUCH_TARGET + 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryLabel: { ...typo("labelMd"), color: COLORS.onPrimaryContainer },
  cancelButton: {
    flex: 1,
    minHeight: TOUCH_TARGET + 8,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: alpha(COLORS.error, 0.5),
    backgroundColor: alpha(COLORS.error, 0.1),
    alignItems: "center",
    justifyContent: "center",
  },
  cancelLabel: { ...typo("labelMd"), color: COLORS.error },

  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
});
