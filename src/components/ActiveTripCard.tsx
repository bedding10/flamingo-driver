import React from "react";
import { Alert, StyleSheet, View } from "react-native";
import type { Trip, TripStatus } from "../types/trip";
import { strings } from "../i18n/strings";
import { ProfileAvatar } from "./ProfileAvatar";
import {
  AppText,
  Badge,
  Button,
  Money,
  rtlRow,
  type BadgeTone,
} from "../ui";
import { colors, radius, shadows, spacing, usePalette } from "../theme";

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

function statusTone(status: TripStatus): BadgeTone {
  if (status === "IN_PROGRESS") return "success";
  if (status === "ARRIVING") return "warning";
  return "info";
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
 *
 * DESIGN PHASE: rebuilt on the design system - Button, Money, Badge and AppText
 * instead of five bespoke Pressables and a private stylesheet. The state
 * machine, the confirmations and the position of the SOS button are exactly as
 * PHASE 6 left them, because those are safety decisions, not styling.
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
  const palette = usePalette();

  const status = trip.status;
  const primary = actionLabel(nextStatus);
  const enRoute = status === "IN_PROGRESS";
  const address = enRoute
    ? trip.destAddress || strings.offer.unknownAddress
    : trip.pickupAddress || strings.offer.unknownAddress;

  const passengerLevel = trip.passenger?.profileLevel;
  const levelLine = passengerLevel
    ? (LEVEL_LABELS[passengerLevel] ?? passengerLevel) +
      (trip.passenger?.completedTripsCount != null
        ? ` \u00b7 ${trip.passenger.completedTripsCount} ${strings.level.tripsShort}`
        : "")
    : null;

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
    <View
      style={[
        styles.sheet,
        {
          paddingBottom: bottomInset + spacing.xl,
          backgroundColor: palette.surface,
          borderColor: palette.border,
        },
      ]}
    >
      <View style={styles.headRow}>
        <Badge label={statusLabel(status)} tone={statusTone(status)} solid />
        {trip.fare != null ? (
          <Money
            amount={trip.fare}
            currency={trip.currency ?? undefined}
            decimals={0}
            tone="primary"
          />
        ) : null}
      </View>

      {/* One leg only: the one the driver is heading to right now. */}
      <View style={styles.leg}>
        <View
          style={[
            styles.dot,
            { backgroundColor: enRoute ? colors.coral : palette.online },
          ]}
        />
        <View style={styles.legText}>
          <AppText variant="caption" tone="secondary">
            {enRoute ? strings.offer.dropoff : strings.offer.pickup}
          </AppText>
          <AppText numberOfLines={2}>{address}</AppText>
        </View>
      </View>

      {/*
        Passenger identity.

        PHASE 4: the call button appears below only when `onCall` was passed,
        which the screen does only after GET /trip-communication/:tripId returned
        canCall AND a number. The card still holds no phone number of its own -
        /driver/me/trips keeps returning the passenger phone masked through
        maskPhone(), and "phoneHidden" is shown exactly when the server refused
        to reveal it (phoneMode HIDDEN, or a trip that is no longer callable).
      */}
      <View style={styles.contactRow}>
        <ProfileAvatar
          avatarUrl={trip.passenger?.avatarUrl}
          frameUrl={trip.passenger?.profileFrameUrl}
          size={44}
          fallback={trip.passenger?.name ?? null}
        />
        <View style={styles.passengerBlock}>
          <AppText variant="subtitle" numberOfLines={1}>
            {trip.passenger?.name || strings.offer.passengerFallback}
          </AppText>
          {levelLine ? (
            <AppText variant="caption" tone="brand" numberOfLines={1}>
              {levelLine}
            </AppText>
          ) : null}
          {!onCall ? (
            <AppText variant="caption" tone="muted" numberOfLines={1}>
              {strings.trip.phoneHidden}
            </AppText>
          ) : null}
        </View>
        {unreadCount > 0 ? (
          <Badge
            label={unreadCount > 9 ? "9+" : String(unreadCount)}
            tone="brand"
            solid
          />
        ) : null}
      </View>

      <View style={styles.contactActions}>
        <Button
          label={strings.chat.openChat}
          icon="chat"
          variant="secondary"
          size="md"
          onPress={onChat}
          style={styles.flex1}
        />
        {onCall ? (
          <Button
            label={strings.chat.call}
            icon="phone"
            variant="secondary"
            size="md"
            onPress={onCall}
            style={styles.flex1}
          />
        ) : null}
      </View>

      {error ? (
        <AppText variant="caption" tone="danger">
          {error}
        </AppText>
      ) : null}

      <View style={styles.actions}>
        <Button
          label={strings.trip.cancel}
          variant="danger"
          size="lg"
          disabled={pending}
          onPress={confirmCancel}
          style={styles.flex1}
        />
        {primary ? (
          <Button
            label={primary}
            variant="primary"
            size="lg"
            loading={pending}
            onPress={confirmAdvance}
            style={styles.flex2}
          />
        ) : null}
      </View>

      {/*
        Full width and on its own row: the driver must find it without aiming.
        Outlined rather than filled so it never competes with the primary action
        for an unaimed thumb.
      */}
      <Button
        label={strings.safety.sos}
        icon="sos"
        variant="secondary"
        size="md"
        onPress={confirmSos}
        style={[styles.sos, { borderColor: palette.danger }]}
      />
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
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderTopWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.md,
    ...shadows.floating,
  },
  headRow: {
    ...rtlRow,
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },

  leg: { ...rtlRow, alignItems: "flex-start", gap: spacing.md },
  dot: { width: 10, height: 10, borderRadius: radius.pill, marginTop: 6 },
  legText: { flex: 1, gap: 2 },

  contactRow: { ...rtlRow, alignItems: "center", gap: spacing.md },
  passengerBlock: { flex: 1, gap: 2 },
  contactActions: { ...rtlRow, gap: spacing.md },

  actions: { ...rtlRow, gap: spacing.md },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  sos: { borderWidth: 1.5 },
});
