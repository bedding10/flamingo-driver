import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { RideOffer } from "../types/trip";
import { strings } from "../i18n/strings";
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
  offer: RideOffer;
  awaiting: boolean;
  notice: string | null;
  bottomInset: number;
  onAccept: (tripId: string) => void;
  onDecline: (tripId: string) => void;
};

const TICK_MS = 250;

function money(amount: number, currency?: string | null): string {
  const rounded = Math.round(amount);
  return currency ? rounded + " " + currency : String(rounded);
}

/**
 * The ride offer card.
 *
 * The countdown is driven by `offer.expiresInMs` sent with every offer, never
 * by a constant in the app: OFFER_TIMEOUT_MS lives in MatchingService and can
 * be retuned server side. A hardcoded 15s would silently start lying the day
 * that value changes, and a driver who trusts a wrong timer loses rides.
 */
function RideOfferCardComponent({
  offer,
  awaiting,
  notice,
  bottomInset,
  onAccept,
  onDecline,
}: Props) {
  const total = offer.expiresInMs > 0 ? offer.expiresInMs : 1;
  const deadlineRef = useRef(Date.now() + total);
  const [remaining, setRemaining] = useState(total);

  useEffect(() => {
    // Re-armed per offer: a new tripId is a new deadline.
    deadlineRef.current = Date.now() + total;
    setRemaining(total);
    const timer = setInterval(() => {
      const left = deadlineRef.current - Date.now();
      setRemaining(left > 0 ? left : 0);
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [offer.tripId, total]);

  const seconds = Math.ceil(remaining / 1000);
  const ratio = Math.max(0, Math.min(1, remaining / total));
  // Wall-clock based, so a frozen JS thread cannot make the bar lie.
  const urgent = remaining <= 5000;

  // Phase 7: the net is authoritative from the backend (`driverNet`), which
  // uses the same settlement math as the wallet. We never recompute pricing
  // on the client. If an older backend omits it, we simply hide the net line
  // rather than showing a number that could contradict the actual payout.
  const commissionPct = offer.commissionPct ?? 0;
  const net = offer.driverNet ?? null;

  return (
    <View style={[styles.sheet, { paddingBottom: bottomInset + spacing.xl }]}>
      <View style={styles.timerTrack}>
        <View
          style={[
            styles.timerFill,
            {
              width: (ratio * 100) + "%",
              backgroundColor: urgent ? colors.coral : colors.gold,
            },
          ]}
        />
      </View>

      <View style={styles.headRow}>
        <Text style={styles.title}>{strings.offer.title}</Text>
        <Text style={[styles.countdown, urgent ? styles.countdownUrgent : null]}>
          {seconds + strings.offer.secondsSuffix}
        </Text>
      </View>

      <View style={styles.fareRow}>
        <Text style={styles.fare}>{money(offer.fare, offer.currency)}</Text>
        <View style={styles.fareMeta}>
          {offer.distanceKm != null ? (
            <Text style={styles.meta}>
              {offer.distanceKm.toFixed(1) + " " + strings.offer.kmSuffix}
            </Text>
          ) : null}
          {net != null && commissionPct > 0 ? (
            <Text style={styles.meta}>
              {strings.offer.netApprox + " " + money(net, offer.currency) +
                " \u00b7 " + strings.offer.commissionLabel + " " +
                commissionPct + "%"}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.leg}>
        <View style={[styles.dot, styles.dotPickup]} />
        <View style={styles.legText}>
          <Text style={styles.legLabel}>{strings.offer.pickup}</Text>
          <Text style={styles.legValue} numberOfLines={2}>
            {offer.pickupAddress || strings.offer.unknownAddress}
          </Text>
        </View>
      </View>

      <View style={styles.leg}>
        <View style={[styles.dot, styles.dotDrop]} />
        <View style={styles.legText}>
          <Text style={styles.legLabel}>{strings.offer.dropoff}</Text>
          <Text style={styles.legValue} numberOfLines={2}>
            {offer.destAddress || strings.offer.unknownAddress}
          </Text>
        </View>
      </View>

      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={strings.offer.decline}
          disabled={awaiting}
          onPress={() => onDecline(offer.tripId)}
          style={({ pressed }) => [
            styles.declineButton,
            pressed ? styles.pressed : null,
            awaiting ? styles.disabled : null,
          ]}
        >
          <Text style={styles.declineLabel}>{strings.offer.decline}</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={strings.offer.accept}
          disabled={awaiting}
          onPress={() => onAccept(offer.tripId)}
          style={({ pressed }) => [
            styles.acceptButton,
            pressed ? styles.pressed : null,
            awaiting ? styles.disabled : null,
          ]}
        >
          <Text style={styles.acceptLabel}>
            {awaiting ? strings.offer.awaiting : strings.offer.accept}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export const RideOfferCard = React.memo(RideOfferCardComponent);

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
    paddingTop: spacing.lg,
    gap: spacing.md,
    ...shadows.floating,
  },

  timerTrack: {
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: withAlpha(colors.white, 0.12),
    overflow: "hidden",
  },
  timerFill: { height: 4, borderRadius: radius.pill },

  headRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    ...typography.subtitle,
    color: colors.textOnDark,
    textAlign: "right",
    writingDirection: "rtl",
  },
  countdown: { ...typography.subtitle, color: colors.gold },
  countdownUrgent: { color: colors.coral },

  fareRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  fare: { ...typography.numeric, color: colors.gold },
  fareMeta: { alignItems: "flex-start", gap: 2, flexShrink: 1 },
  meta: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    textAlign: "left",
  },

  leg: { flexDirection: "row-reverse", alignItems: "flex-start", gap: spacing.md },
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

  notice: {
    ...typography.caption,
    color: colors.warning,
    textAlign: "right",
    writingDirection: "rtl",
  },

  actions: { flexDirection: "row-reverse", gap: spacing.md },
  acceptButton: {
    flex: 2,
    height: touchTarget.critical,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptLabel: { ...typography.subtitle, color: colors.ink },
  declineButton: {
    flex: 1,
    height: touchTarget.critical,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: withAlpha(colors.white, 0.06),
    alignItems: "center",
    justifyContent: "center",
  },
  declineLabel: { ...typography.subtitle, color: colors.textOnDarkSecondary },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
});
