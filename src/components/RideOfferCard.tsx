import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { fareOffersApi, toApiError } from "../api";
import { ProfileAvatar } from "./ProfileAvatar";
import { Icon } from "./Icon";
import type { RideOffer } from "../types/trip";
import { textAlignStart } from "../i18n";
import { strings } from "../i18n/strings";
import { offer75Strings, rideClassLabels } from "../i18n/strings.phase75";
import {
  radius,
  shadows,
  spacing,
  touchTarget,
  typography,
  usePalette,
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

/**
 * Copy for the counter-offer panel. Local on purpose: src/i18n/strings.ts must
 * not be rewritten and these lines are used only here.
 */
const NEG = {
  open: "\u0627\u0642\u062a\u0631\u062d \u0633\u0639\u0631\u064b\u0627",
  title:
    "\u0633\u0639\u0631\u0643 \u0627\u0644\u0645\u0642\u062a\u0631\u062d",
  band: "\u0627\u0644\u0645\u062f\u0649 \u0627\u0644\u0645\u0633\u0645\u0648\u062d",
  notePlaceholder:
    "\u0645\u0644\u0627\u062d\u0637\u0629 \u0644\u0644\u0631\u0627\u0643\u0628 (\u0627\u062e\u062a\u064a\u0627\u0631\u064a)",
  send: "\u0623\u0631\u0633\u0644 \u0627\u0644\u0639\u0631\u0636",
  sending: "\u062c\u0627\u0631\u064d \u0627\u0644\u0625\u0631\u0633\u0627\u0644...",
  cancel: "\u0625\u0644\u063a\u0627\u0621",
  waiting:
    "\u0628\u0627\u0646\u062a\u0638\u0627\u0631 \u0631\u062f \u0627\u0644\u0631\u0627\u0643\u0628 \u0639\u0644\u0649 \u0633\u0639\u0631\u0643",
  waitingHint:
    "\u0625\u0646 \u0642\u0628\u0644 \u0627\u0644\u0631\u0627\u0643\u0628 \u0633\u062a\u0628\u062f\u0623 \u0627\u0644\u0631\u062d\u0644\u0629 \u062a\u0644\u0642\u0627\u0626\u064a\u064b\u0627.",
  invalid:
    "\u0623\u062f\u062e\u0644 \u0645\u0628\u0644\u063a\u064b\u0627 \u0635\u062d\u064a\u062d\u064b\u0627 \u062f\u0627\u062e\u0644 \u0627\u0644\u0645\u062f\u0649.",
} as const;

function money(amount: number, currency?: string | null): string {
  const rounded = Math.round(amount);
  return currency ? rounded + " " + currency : String(rounded);
}

/**
 * The ride offer card.
 *
 * PHASE 7.5 rebuilt the presentation: the passenger now has a face - avatar with
 * the level frame the backend awarded, name, rating and completed-trip count -
 * the fare leads the card, and accept is the only filled (pink) action while
 * skip stays a quiet outline. It is a floating card inset from the edges rather
 * than a full-bleed sheet, so the map and the pickup pin stay visible: a driver
 * decides on an offer by looking at WHERE it is.
 *
 * NEGOTIATION (Stitch ride_negotiation_offer + negotiation_waiting_state): the
 * driver can answer a dispatched offer with his own price instead of taking it
 * or skipping it. The panel is GATED on `offer.fareQuoteId`, because
 * POST /driver/fare-offers is keyed on a quote id and MatchingService does not
 * send one with `ride:offer` yet; and on `offer.negotiable !== false`, which
 * mirrors VehicleType.allowsNegotiation. When the field is absent the card keeps
 * its old footnote pointing at the requests list, so nothing on screen promises
 * an action the server cannot take. See SERVER_TODO.md section 3.
 *
 * The band shown and enforced is the server's own (negotiationMin /
 * negotiationMax from VehiclePricingRule). No band is invented locally: without
 * it the driver types freely and the server's rejection is what he reads.
 *
 * Two deliberate omissions remain, for the same reason - the server does not
 * send them and inventing them would mislead the person deciding:
 *  - rating COUNT: `passenger.rating` arrives without a sample size.
 *  - distance to the passenger and ETA: `ride:offer` carries the trip distance
 *    (`distanceKm`) only, so that is what is labelled. No haversine is computed
 *    from the last GPS fix and passed off as a routed distance.
 *
 * The countdown is driven by `offer.expiresInMs` sent with every offer, never by
 * a constant: OFFER_TIMEOUT_MS lives in MatchingService and can be retuned
 * server side, and a driver who trusts a wrong timer loses rides. It is
 * wall-clock based, so a frozen JS thread cannot make the bar lie.
 *
 * PHASE 1 (R-11): this file carried the most hand-written direction
 * compensation in the tree - eight `"row-reverse"` rows and seven text styles
 * pinned with `textAlign: "right"` / `writingDirection: "rtl"`. With real RTL
 * enabled every one of them cancelled React Native's own mirroring. That
 * mattered here more than anywhere: the driver has twenty server-enforced
 * seconds to read this card and decide, so a row on the wrong side is a lost
 * ride, not a cosmetic defect. All rows are plain `"row"` now.
 *
 * Module-level StyleSheet.create is safe: importing "../i18n" runs that module
 * (including syncDirectionAtBoot()) to completion before this file's body is
 * evaluated, so textAlignStart() reads a settled direction.
 */
function RideOfferCardComponent({
  offer,
  awaiting,
  notice,
  bottomInset,
  onAccept,
  onDecline,
}: Props) {
  const palette = usePalette();

  const total = offer.expiresInMs > 0 ? offer.expiresInMs : 1;
  const deadlineRef = useRef(Date.now() + total);
  const [remaining, setRemaining] = useState(total);

  /** Counter-offer state: closed -> editing -> sent. */
  const [negotiating, setNegotiating] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [negError, setNegError] = useState<string | null>(null);

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

  // A new offer resets the panel: the previous bid belonged to another request.
  useEffect(() => {
    setNegotiating(false);
    setSent(false);
    setNegError(null);
    setNote("");
    setAmount(String(Math.round(offer.fare)));
  }, [offer.tripId, offer.fare]);

  const seconds = Math.ceil(remaining / 1000);
  const ratio = Math.max(0, Math.min(1, remaining / total));
  const urgent = remaining <= 5000;

  /**
   * React Native's `width` accepts a number or a `${number}%` token, not any
   * string, so the percentage is built once and asserted to that token type.
   * Concatenating a number with "%" produces a plain `string` and does not
   * type-check under `tsc --noEmit`.
   */
  const fillWidth = (Math.round(ratio * 1000) / 10 + "%") as `${number}%`;

  // The net is authoritative from the backend (`driverNet`), computed with the
  // same settlement math as the wallet. The app must NOT recompute it: a local
  // fare - fare*pct/100 diverges the moment a coupon is involved.
  const commissionPct = offer.commissionPct ?? 0;
  const net = offer.driverNet ?? null;

  const passenger = offer.passenger ?? null;
  const rideClassLabel = offer.rideClass
    ? (rideClassLabels[offer.rideClass] ?? offer.rideClass)
    : null;

  /** Can this offer be answered with a price at all? Server data decides. */
  const canNegotiate =
    Boolean(offer.fareQuoteId) && offer.negotiable !== false && !awaiting;

  const min = offer.negotiationMin ?? null;
  const max = offer.negotiationMax ?? null;
  /** A 5% nudge, floor 10, purely a keypad shortcut - not a pricing rule. */
  const step = useMemo(
    () => Math.max(10, Math.round(offer.fare * 0.05)),
    [offer.fare],
  );

  const numeric = Number(amount);
  const valid =
    Number.isFinite(numeric) &&
    numeric > 0 &&
    (min == null || numeric >= min) &&
    (max == null || numeric <= max);

  const nudge = (delta: number) => {
    const base = Number.isFinite(numeric) ? numeric : offer.fare;
    let next = Math.round(base + delta);
    if (min != null && next < min) next = Math.round(min);
    if (max != null && next > max) next = Math.round(max);
    setAmount(String(next));
    setNegError(null);
  };

  const sendCounterOffer = async () => {
    if (!offer.fareQuoteId) return;
    if (!valid) {
      setNegError(NEG.invalid);
      return;
    }
    setSending(true);
    setNegError(null);
    try {
      await fareOffersApi.submitFareOffer({
        fareQuoteId: offer.fareQuoteId,
        amount: Math.round(numeric),
        note: note.trim() ? note.trim() : undefined,
      });
      setSent(true);
      setNegotiating(false);
    } catch (error) {
      // The server owns the band and the race; its message is the truth.
      setNegError(toApiError(error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          bottom: bottomInset,
          backgroundColor: palette.surface,
          borderColor: palette.border,
        },
      ]}
    >
      <View style={[styles.timerTrack, { backgroundColor: palette.surfaceSunken }]}>
        <View
          style={[
            styles.timerFill,
            {
              width: fillWidth,
              backgroundColor: urgent ? palette.danger : palette.primary,
            },
          ]}
        />
      </View>

      <View style={styles.headRow}>
        <Text style={[styles.kicker, { color: palette.primaryText }]}>
          {offer75Strings.newRequest}
        </Text>
        <Text
          style={[
            styles.countdown,
            { color: urgent ? palette.danger : palette.textSecondary },
          ]}
        >
          {seconds + strings.offer.secondsSuffix}
        </Text>
      </View>

      {/* Passenger identity. */}
      <View style={styles.passengerRow}>
        <ProfileAvatar
          avatarUrl={passenger?.avatarUrl}
          frameUrl={passenger?.profileFrameUrl}
          size={48}
          fallback={passenger?.name ?? offer75Strings.passengerFallback}
          accessibilityLabel={passenger?.name ?? offer75Strings.passengerFallback}
        />
        <View style={styles.passengerText}>
          <Text
            style={[styles.passengerName, { color: palette.textPrimary }]}
            numberOfLines={1}
          >
            {passenger?.name || offer75Strings.passengerFallback}
          </Text>
          <View style={styles.passengerMeta}>
            {passenger?.rating != null ? (
              <View style={styles.metaChip}>
                <Icon name="star" size={13} color={palette.primaryText} />
                <Text style={[styles.meta, { color: palette.textSecondary }]}>
                  {passenger.rating.toFixed(1)}
                </Text>
              </View>
            ) : null}
            {passenger?.completedTripsCount != null ? (
              <Text style={[styles.meta, { color: palette.textSecondary }]}>
                {passenger.completedTripsCount +
                  " " +
                  offer75Strings.completedShort}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.fareCol}>
          <Text style={[styles.fare, { color: palette.textPrimary }]}>
            {money(offer.fare, offer.currency)}
          </Text>
          {net != null && commissionPct > 0 ? (
            <Text style={[styles.meta, { color: palette.textSecondary }]}>
              {offer75Strings.netLabel +
                " " +
                money(net, offer.currency) +
                " \u00b7 " +
                offer75Strings.commissionLabel +
                " " +
                commissionPct +
                "%"}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Trip facts the server actually sent. */}
      {offer.distanceKm != null || rideClassLabel ? (
        <View style={styles.factsRow}>
          {offer.distanceKm != null ? (
            <Text style={[styles.meta, { color: palette.textSecondary }]}>
              {offer75Strings.tripDistance +
                " " +
                offer.distanceKm.toFixed(1) +
                " " +
                strings.offer.kmSuffix}
            </Text>
          ) : null}
          {rideClassLabel ? (
            <Text style={[styles.meta, { color: palette.textSecondary }]}>
              {rideClassLabel}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.leg}>
        <View style={[styles.dot, { backgroundColor: palette.online }]} />
        <Text
          style={[styles.legValue, { color: palette.textPrimary }]}
          numberOfLines={1}
        >
          {offer.pickupAddress || strings.offer.unknownAddress}
        </Text>
      </View>
      <View style={styles.leg}>
        <View style={[styles.dot, { backgroundColor: palette.primary }]} />
        <Text
          style={[styles.legValue, { color: palette.textSecondary }]}
          numberOfLines={1}
        >
          {offer.destAddress || strings.offer.unknownAddress}
        </Text>
      </View>

      {notice ? (
        <Text style={[styles.notice, { color: palette.warning }]}>{notice}</Text>
      ) : null}

      {/* ---- counter-offer -------------------------------------------------
          Only rendered when the payload can actually be bid on. */}
      {sent ? (
        <View
          style={[
            styles.negPanel,
            {
              backgroundColor: palette.surfaceSunken,
              borderColor: palette.border,
            },
          ]}
        >
          <Text style={[styles.negTitle, { color: palette.textPrimary }]}>
            {NEG.waiting + ": " + money(numeric, offer.currency)}
          </Text>
          <Text style={[styles.meta, { color: palette.textSecondary }]}>
            {NEG.waitingHint}
          </Text>
        </View>
      ) : negotiating ? (
        <View
          style={[
            styles.negPanel,
            {
              backgroundColor: palette.surfaceSunken,
              borderColor: palette.border,
            },
          ]}
        >
          <Text style={[styles.negTitle, { color: palette.textPrimary }]}>
            {NEG.title}
          </Text>

          {/* Stepper. Plain "row": mirrored under RTL. */}
          <View style={styles.stepperRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="-"
              onPress={() => nudge(-step)}
              style={[styles.stepper, { borderColor: palette.borderStrong }]}
            >
              <Text style={[styles.stepperText, { color: palette.textPrimary }]}>
                {"\u2212"}
              </Text>
            </Pressable>

            <TextInput
              value={amount}
              onChangeText={(next) => {
                setAmount(next.replace(/[^0-9]/g, ""));
                setNegError(null);
              }}
              keyboardType="number-pad"
              style={[
                styles.amountInput,
                {
                  color: palette.textPrimary,
                  borderColor: valid ? palette.border : palette.danger,
                  backgroundColor: palette.surface,
                },
              ]}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="+"
              onPress={() => nudge(step)}
              style={[styles.stepper, { borderColor: palette.borderStrong }]}
            >
              <Text style={[styles.stepperText, { color: palette.textPrimary }]}>
                {"+"}
              </Text>
            </Pressable>
          </View>

          {min != null || max != null ? (
            <Text style={[styles.meta, { color: palette.textSecondary }]}>
              {NEG.band +
                ": " +
                money(min ?? 0, offer.currency) +
                " \u2013 " +
                money(max ?? 0, offer.currency)}
            </Text>
          ) : null}

          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={NEG.notePlaceholder}
            placeholderTextColor={palette.textMuted}
            style={[
              styles.noteInput,
              {
                color: palette.textPrimary,
                borderColor: palette.border,
                backgroundColor: palette.surface,
              },
            ]}
          />

          {negError ? (
            <Text style={[styles.notice, { color: palette.danger }]}>
              {negError}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={NEG.cancel}
              disabled={sending}
              onPress={() => {
                setNegotiating(false);
                setNegError(null);
              }}
              style={({ pressed }) => [
                styles.skipButton,
                { borderColor: palette.borderStrong },
                pressed ? styles.pressed : null,
                sending ? styles.disabled : null,
              ]}
            >
              <Text style={[styles.skipLabel, { color: palette.textSecondary }]}>
                {NEG.cancel}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={NEG.send}
              disabled={sending || !valid}
              onPress={() => {
                void sendCounterOffer();
              }}
              style={({ pressed }) => [
                styles.acceptButton,
                { backgroundColor: palette.primary },
                pressed ? styles.pressed : null,
                sending || !valid ? styles.disabled : null,
              ]}
            >
              <Text style={[styles.acceptLabel, { color: palette.onPrimary }]}>
                {sending ? NEG.sending : NEG.send}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={offer75Strings.skip}
            disabled={awaiting}
            onPress={() => onDecline(offer.tripId)}
            style={({ pressed }) => [
              styles.skipButton,
              { borderColor: palette.borderStrong },
              pressed ? styles.pressed : null,
              awaiting ? styles.disabled : null,
            ]}
          >
            <Text style={[styles.skipLabel, { color: palette.textSecondary }]}>
              {offer75Strings.skip}
            </Text>
          </Pressable>

          {canNegotiate ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={NEG.open}
              onPress={() => setNegotiating(true)}
              style={({ pressed }) => [
                styles.skipButton,
                { borderColor: palette.primary },
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={[styles.skipLabel, { color: palette.primaryText }]}>
                {NEG.open}
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={offer75Strings.accept}
            disabled={awaiting}
            onPress={() => onAccept(offer.tripId)}
            style={({ pressed }) => [
              styles.acceptButton,
              { backgroundColor: palette.primary },
              pressed ? styles.pressed : null,
              awaiting ? styles.disabled : null,
            ]}
          >
            <Text style={[styles.acceptLabel, { color: palette.onPrimary }]}>
              {awaiting ? offer75Strings.awaiting : offer75Strings.accept}
            </Text>
          </Pressable>
        </View>
      )}

      {/* The old pointer to the bidding list stays ONLY while this offer cannot
          be negotiated in place. */}
      {!canNegotiate && !sent ? (
        <Text style={[styles.footnote, { color: palette.textMuted }]}>
          {offer75Strings.bidElsewhere}
        </Text>
      ) : null}
    </View>
  );
}

export const RideOfferCard = React.memo(RideOfferCardComponent);

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    // Symmetric inset: identical on both sides, so there is nothing to mirror.
    left: 14,
    right: 14,
    borderRadius: radius.sheet,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    ...shadows.floating,
  },

  timerTrack: { height: 4, borderRadius: radius.pill, overflow: "hidden" },
  timerFill: { height: 4, borderRadius: radius.pill },

  // Every row below is plain "row": mirrored by React Native under RTL.
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kicker: {
    ...typography.label,
    fontWeight: "700",
    textAlign: textAlignStart(),
  },
  countdown: { ...typography.label, fontWeight: "700" },

  passengerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  passengerText: { flex: 1, gap: 2 },
  passengerName: {
    ...typography.subtitle,
    textAlign: textAlignStart(),
  },
  passengerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 3 },
  meta: { ...typography.caption },
  // Logical: follows the layout direction already.
  fareCol: { alignItems: "flex-start", gap: 2, maxWidth: "38%" },
  fare: { ...typography.numeric, fontSize: 22 },

  factsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },

  leg: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legValue: {
    ...typography.body,
    flex: 1,
    textAlign: textAlignStart(),
  },

  notice: {
    ...typography.caption,
    textAlign: textAlignStart(),
  },

  /** The counter-offer block, sunken so it reads as a sub-surface. */
  negPanel: {
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  negTitle: {
    ...typography.subtitle,
    fontWeight: "700",
    textAlign: textAlignStart(),
  },
  stepperRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  stepper: {
    width: touchTarget.min,
    height: touchTarget.min,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperText: { ...typography.title },
  amountInput: {
    flex: 1,
    height: touchTarget.min,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    ...typography.numeric,
    // A price is a number: centred, so there is no side to mirror.
    textAlign: "center",
  },
  noteInput: {
    minHeight: touchTarget.min,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    textAlign: textAlignStart(),
  },

  actions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  acceptButton: {
    flex: 2,
    height: touchTarget.critical,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptLabel: { ...typography.subtitle, fontWeight: "700" },
  skipButton: {
    flex: 1,
    height: touchTarget.critical,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  skipLabel: { ...typography.subtitle },
  footnote: {
    ...typography.caption,
    textAlign: textAlignStart(),
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
});
