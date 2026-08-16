import React from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import type { Trip, TripStatus } from "../types/trip";
import { strings } from "../i18n/strings";
import { ProfileAvatar } from "./ProfileAvatar";
import {
  colors,
  radius,
  spacing,
  touchTarget,
  typography,
  withAlpha,
  shadows,
} from "../theme";

type Props = {
  trip: Trip;
  nextStatus: TripStatus | null;
  pending: boolean;
  error: string | null;
  bottomInset: number;
  onAdvance: () => void;
  onCancel: () => void;
  /** Raises a safety report on the server for the running trip. */
  onSos: () => void;
  /** Opens the trip chat with the passenger. */
  onChat: () => void;
  /**
   * PHASE 4 - dials the passenger. Passed only when the server actually
   * authorised a number for this trip; absent otherwise, and the card then
   * keeps saying the number is hidden.
   */
  onCall?: () => void;
  /** Passenger messages this driver has not opened yet. */
  unreadCount?: number;
};

// Phase 11 - display labels only. The level itself is decided by the backend;
// this card never compares a trip count against a threshold.
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
 * The card shown while a ride is running.
 *
 * The address on display is always the one that matters next: before pickup it
 * is where the passenger waits, after pickup it is where they are going. Two
 * addresses at once is how a driver reads the wrong one at a junction.
 */
function ActiveTripCardComponent({
  trip,
  nextStatus,
  pending,
  error,
  bottomInset,
  onAdvance,
  onCancel,
  onSos,
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

  // SOS confirms first for the same reason Complete and Cancel do: a stray tap
  // must not raise a false alarm that support then has to chase. It is
  // deliberately NOT disabled while `pending` - a driver in danger cannot be
  // made to wait for an unrelated status call to come back.
  const confirmSos = () => {
    Alert.alert(strings.safety.confirmTitle, strings.safety.confirmBody, [
      { text: strings.safety.back, style: "cancel" },
      {
        text: strings.safety.confirmSend,
        style: "destructive",
        onPress: onSos,
      },
    ]);
  };

  return (
    <View style={[styles.sheet, { paddingBottom: bottomInset + spacing.xl }]}>
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

      {/*
        Passenger identity line and the two ways to reach them, on one row.

        PHASE 4: the call button appears here only when `onCall` was passed,
        which the screen does only after GET /trip-communication/:tripId returned
        canCall AND a number. The card still holds no phone number of its own -
        /driver/me/trips keeps returning the passenger phone masked through
        maskPhone(), and "phoneHidden" is shown exactly when the server refused
        to reveal it (phoneMode HIDDEN, or a trip that is no longer callable).
      */}
      <View style={styles.contactRow}>
        {/* Phase 11 - passenger photo inside the level frame, then name and
            "LEVEL \u00b7 N trips". Both values ride along with the trip payload,
            so drawing this costs no extra request. */}
        <ProfileAvatar
          avatarUrl={trip.passenger?.avatarUrl}
          frameUrl={trip.passenger?.profileFrameUrl}
          size={44}
          fallback={trip.passenger?.name ?? null}
        />
        <View style={styles.passengerBlock}>
          <Text style={styles.passenger} numberOfLines={1}>
            {(trip.passenger?.name || strings.offer.passengerFallback) +
              (onCall ? "" : " \u00b7 " + strings.trip.phoneHidden)}
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
              styles.callButton,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={styles.callIcon}>{"\u2706"}</Text>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={strings.chat.openChat}
          onPress={onChat}
          style={({ pressed }) => [
            styles.chatButton,
            pressed ? styles.pressed : null,
          ]}
        >
          <Text style={styles.chatLabel}>{strings.chat.openChat}</Text>
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

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={strings.safety.sos}
        onPress={confirmSos}
        style={({ pressed }) => [
          styles.sosButton,
          pressed ? styles.pressed : null,
        ]}
      >
        <Text style={styles.sosLabel}>{strings.safety.sos}</Text>
      </Pressable>
    </View>
  );
}

export const ActiveTripCard = React.memo(ActiveTripCardComponent);

const styles = StyleSheet.create({
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
  headRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heading: {
    ...typography.subtitle,
    color: colors.textOnDark,
    textAlign: "right",
    writingDirection: "rtl",
  },
  fare: { ...typography.subtitle, color: colors.gold },

  leg: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  dot: { width: 10, height: 10, borderRadius: radius.pill, marginTop: 6 },
  dotPickup: { backgroundColor: colors.online },
  dotDrop: { backgroundColor: colors.coral },
  legText: { flex: 1, gap: 2 },
  legLabel: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    textAlign: "right",
    writingDirection: "rtl",
  },
  legValue: {
    ...typography.body,
    color: colors.textOnDark,
    textAlign: "right",
    writingDirection: "rtl",
  },

  contactRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  // المرحلة 11: الاسم فوق وسطر المستوى تحته، دون توسيع البطاقة.
  passengerBlock: { flex: 1, gap: 2 },
  passengerLevel: {
    ...typography.caption,
    color: colors.gold,
    textAlign: "right",
    writingDirection: "rtl",
  },
  passenger: {
    flex: 1,
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    textAlign: "right",
    writingDirection: "rtl",
  },
  // PHASE 4: نفس هوية زر المحادثة لكن دائري وأصغر، فالاتصال إجراء ثانوي
  // بجانب المحادثة ولا يجوز أن ينافس الزر الذهبي الأساسي.
  callButton: {
    width: touchTarget.normal - 8,
    height: touchTarget.normal - 8,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: withAlpha(colors.gold, 0.5),
    backgroundColor: withAlpha(colors.gold, 0.12),
  },
  callIcon: { fontSize: 20, color: colors.gold },
  chatButton: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: touchTarget.normal - 12,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: withAlpha(colors.gold, 0.5),
    backgroundColor: withAlpha(colors.gold, 0.12),
  },
  chatLabel: { ...typography.label, color: colors.gold },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.coral,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { ...typography.caption, color: colors.white, lineHeight: 16 },
  error: {
    ...typography.caption,
    color: colors.danger,
    textAlign: "right",
    writingDirection: "rtl",
  },

  actions: { flexDirection: "row-reverse", gap: spacing.md },
  primaryButton: {
    flex: 2,
    height: touchTarget.critical,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryLabel: { ...typography.subtitle, color: colors.ink },
  cancelButton: {
    flex: 1,
    height: touchTarget.critical,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: withAlpha(colors.danger, 0.5),
    backgroundColor: withAlpha(colors.danger, 0.10),
    alignItems: "center",
    justifyContent: "center",
  },
  cancelLabel: { ...typography.label, color: colors.danger },

  // Full width and on its own row: the driver must find it without aiming,
  // but outlined rather than filled so it never competes with the gold
  // primary action for an unaimed thumb.
  sosButton: {
    height: touchTarget.normal,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.danger,
    backgroundColor: withAlpha(colors.danger, 0.08),
    alignItems: "center",
    justifyContent: "center",
  },
  sosLabel: { ...typography.label, color: colors.danger },

  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
});
