import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { FareOpportunity } from "../types/fareOffer";
import { requestStrings } from "../i18n/strings.requests";
import {
  colors,
  radius,
  spacing,
  touchTarget,
  typography,
  withAlpha,
} from "../theme";

type Props = {
  item: FareOpportunity;
  /** True while this card's bid or withdrawal is in flight. */
  busy: boolean;
  onBid: (quoteId: string, amount: number) => void;
  onWithdraw: (offerId: string) => void;
};

function money(amount: number, currency?: string | null): string {
  const rounded = Math.round(amount);
  return currency ? rounded + " " + currency : String(rounded);
}

function clock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m + ":" + String(s).padStart(2, "0");
}

/**
 * One open bidding request.
 *
 * The amount field is validated against the server's own band
 * ([minFare, maxFare] returned with the request) so the driver is not sent into
 * a guaranteed FARE_OFFER_OUT_OF_RANGE. The suggested fare is only a starting
 * value - nothing is computed on the client.
 */
function FareOpportunityCardComponent({
  item,
  busy,
  onBid,
  onWithdraw,
}: Props) {
  const initial = item.myOffer?.amount ?? item.proposedFare ?? item.suggestedFare;
  const [amount, setAmount] = useState(String(Math.round(initial)));

  // A new bid accepted by the server (or a fresh poll) re-seeds the field, but
  // only when the driver is not in the middle of typing their own number.
  const editedRef = useRef(false);
  useEffect(() => {
    if (editedRef.current) return;
    setAmount(String(Math.round(initial)));
  }, [initial]);

  const deadline = useMemo(
    () => new Date(item.expiresAt).getTime(),
    [item.expiresAt],
  );
  const [remaining, setRemaining] = useState(deadline - Date.now());
  useEffect(() => {
    setRemaining(deadline - Date.now());
    const timer = setInterval(() => setRemaining(deadline - Date.now()), 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  const expired = remaining <= 0;
  const parsed = Number(amount.replace(/[^0-9.]/g, ""));
  const valid =
    Number.isFinite(parsed) &&
    parsed >= item.minFare &&
    parsed <= item.maxFare;
  const pending = item.myOffer?.status === "PENDING";

  return (
    <View style={[styles.card, expired ? styles.cardExpired : null]}>
      <View style={styles.headRow}>
        <Text style={styles.passenger} numberOfLines={1}>
          {item.passenger?.name ?? requestStrings.title}
        </Text>
        <Text style={[styles.timer, expired ? styles.timerOff : null]}>
          {expired
            ? requestStrings.closed
            : requestStrings.closesIn + " " + clock(remaining)}
        </Text>
      </View>

      <View style={styles.fareRow}>
        <Text style={styles.fare}>
          {money(item.proposedFare ?? item.suggestedFare, item.currency)}
        </Text>
        <View style={styles.metaCol}>
          <Text style={styles.meta}>
            {(item.proposedFare != null
              ? requestStrings.passengerAsked
              : requestStrings.suggested) +
              " \u00b7 " +
              requestStrings.range +
              " " +
              Math.round(item.minFare) +
              " - " +
              Math.round(item.maxFare)}
          </Text>
          <Text style={styles.meta}>
            {[
              item.distanceKm != null
                ? item.distanceKm.toFixed(1) + " " + requestStrings.kmSuffix
                : null,
              item.durationSec != null
                ? Math.round(item.durationSec / 60) +
                  " " +
                  requestStrings.minutesSuffix
                : null,
              item.commissionPct != null
                ? requestStrings.commission + " " + item.commissionPct + "%"
                : null,
            ]
              .filter(Boolean)
              .join(" \u00b7 ")}
          </Text>
        </View>
      </View>

      <View style={styles.leg}>
        <View style={[styles.dot, styles.dotPickup]} />
        <View style={styles.legText}>
          <Text style={styles.legLabel}>{requestStrings.pickup}</Text>
          <Text style={styles.legValue} numberOfLines={2}>
            {item.pickupAddress || requestStrings.unknownAddress}
          </Text>
        </View>
      </View>

      <View style={styles.leg}>
        <View style={[styles.dot, styles.dotDrop]} />
        <View style={styles.legText}>
          <Text style={styles.legLabel}>{requestStrings.dropoff}</Text>
          <Text style={styles.legValue} numberOfLines={2}>
            {item.destAddress || requestStrings.unknownAddress}
          </Text>
        </View>
      </View>

      {item.passengerNote ? (
        <Text style={styles.note} numberOfLines={3}>
          {requestStrings.passengerNote + ": " + item.passengerNote}
        </Text>
      ) : null}

      {pending && item.myOffer ? (
        <Text style={styles.mine}>
          {requestStrings.myOfferAmount +
            " " +
            money(item.myOffer.amount, item.myOffer.currency) +
            " \u00b7 " +
            requestStrings.myOfferPending}
        </Text>
      ) : null}

      <View style={styles.amountRow}>
        <Text style={styles.amountLabel}>{requestStrings.amountLabel}</Text>
        <TextInput
          value={amount}
          onChangeText={(text) => {
            editedRef.current = true;
            setAmount(text.replace(/[^0-9.]/g, ""));
          }}
          keyboardType="numeric"
          editable={!expired && !busy}
          placeholder={requestStrings.amountPlaceholder}
          placeholderTextColor={withAlpha(colors.textOnDarkSecondary, 0.6)}
          selectionColor={colors.gold}
          style={styles.amountInput}
          accessibilityLabel={requestStrings.amountLabel}
        />
      </View>

      {!valid && !expired ? (
        <Text style={styles.invalid}>{requestStrings.outOfRange}</Text>
      ) : null}

      <View style={styles.actions}>
        {pending && item.myOffer ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={requestStrings.withdraw}
            disabled={busy}
            onPress={() => onWithdraw(item.myOffer!.id)}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed ? styles.pressed : null,
              busy ? styles.disabled : null,
            ]}
          >
            <Text style={styles.secondaryLabel}>
              {requestStrings.withdraw}
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={pending ? requestStrings.update : requestStrings.send}
          disabled={busy || expired || !valid}
          onPress={() => onBid(item.id, Math.round(parsed * 100) / 100)}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed ? styles.pressed : null,
            busy || expired || !valid ? styles.disabled : null,
          ]}
        >
          <Text style={styles.primaryLabel}>
            {busy
              ? requestStrings.sending
              : pending
                ? requestStrings.update
                : requestStrings.send}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export const FareOpportunityCard = React.memo(FareOpportunityCardComponent);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardExpired: { opacity: 0.55 },

  headRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  passenger: {
    ...typography.subtitle,
    color: colors.textOnDark,
    textAlign: "right",
    writingDirection: "rtl",
    flexShrink: 1,
  },
  timer: { ...typography.caption, color: colors.gold },
  timerOff: { color: colors.textOnDarkSecondary },

  fareRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  fare: { ...typography.numeric, color: colors.gold },
  metaCol: { alignItems: "flex-start", gap: 2, flexShrink: 1 },
  meta: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    textAlign: "left",
  },

  leg: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  dot: { width: 10, height: 10, borderRadius: radius.pill, marginTop: 6 },
  dotPickup: { backgroundColor: colors.online },
  dotDrop: { backgroundColor: colors.danger },
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

  note: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    textAlign: "right",
    writingDirection: "rtl",
  },
  mine: {
    ...typography.caption,
    color: colors.info,
    textAlign: "right",
    writingDirection: "rtl",
  },

  amountRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.md,
  },
  amountLabel: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    textAlign: "right",
    writingDirection: "rtl",
  },
  amountInput: {
    flex: 1,
    minHeight: touchTarget.normal,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceDarkRaised,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: spacing.lg,
    color: colors.textOnDark,
    ...typography.numeric,
    textAlign: "center",
    writingDirection: "ltr",
  },
  invalid: {
    ...typography.caption,
    color: colors.warning,
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
  secondaryButton: {
    flex: 1,
    height: touchTarget.critical,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: withAlpha(colors.white, 0.06),
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryLabel: {
    ...typography.subtitle,
    color: colors.textOnDarkSecondary,
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
});
