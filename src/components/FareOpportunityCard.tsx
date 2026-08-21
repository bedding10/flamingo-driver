import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { requestStrings } from "../i18n/strings.requests";
import {
  alpha,
  COLORS,
  GLOW_PRIMARY,
  ICON_SIZE,
  RADIUS,
  RANK_RING,
  SEMANTIC,
  SPACING,
  TOUCH_TARGET,
  typo,
  type RankTier,
} from "../theme/tokens";
import type { FareOpportunity } from "../types/fareOffer";
import { PillButton, RankAvatar, RouteTimeline } from "../ui";

/**
 * The negotiation surface, rebuilt from the owner's Stitch reference pack.
 *
 * It is ONE card with TWO states, because that is exactly how Stitch drew it:
 *  - `ride_negotiation_offer` (screen_19): the passenger's price plus the
 *    driver's counter tools.
 *  - `negotiation_waiting_state` (screen_34): after a bid is PENDING. Stitch
 *    drew it full screen; per the owner's rule it collapses into this card so
 *    the driver keeps the list and the map behind it.
 *
 * Nothing about the server contract changed:
 *  - a counter-offer is POST /driver/fare-offers, and re-posting UPDATES the
 *    existing PENDING bid, so "send" and "update" are the same call;
 *  - the amount is validated against [minFare, maxFare] locally purely to avoid
 *    a round trip that could only come back FARE_OFFER_OUT_OF_RANGE;
 *  - "accept" is claimFareQuote: a direct accept that creates the trip, with no
 *    second confirmation from the passenger;
 *  - "cancel negotiation" is withdrawFareOffer on the driver's own offer id.
 *
 * Deliberate deltas from the PNG: no map layer (this card sits in a list), no
 * remote passenger photo from lh3.googleusercontent.com, and Android cannot
 * tint an elevation shadow so the pink glow is iOS-only.
 */

export type FareOpportunityCardProps = {
  item: FareOpportunity;
  /** True while this row has a request in flight. */
  busy?: boolean;
  /** Counter-offer / update: POST /driver/fare-offers. */
  onBid: (quoteId: string, amount: number) => void;
  /** Cancel negotiation: POST /driver/fare-offers/:id/withdraw. */
  onWithdraw: (offerId: string) => void;
  /** Direct accept at the passenger's own price: POST /driver/fare-offers/claim. */
  onAccept?: (quoteId: string, amount?: number) => void;
};

/** The three quick counter chips Stitch shows above the custom field. */
const QUICK_STEPS = [50, 100, 150] as const;

/** m:ss, never negative. */
function clock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function money(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

function FareOpportunityCardBase({
  item,
  busy = false,
  onBid,
  onWithdraw,
  onAccept,
}: FareOpportunityCardProps) {
  /** What the passenger is willing to pay, which is what Accept charges. */
  const askedFare = item.proposedFare ?? item.suggestedFare;
  const myOffer =
    item.myOffer && item.myOffer.status === "PENDING" ? item.myOffer : null;

  // ----- the amount field -------------------------------------------------
  const [amount, setAmount] = useState(() => String(myOffer?.amount ?? askedFare));
  // Polling refreshes this row every 15s. Re-seeding the field on every poll
  // would eat the driver's keystrokes, so it stops as soon as they touch it.
  const editedRef = useRef(false);
  useEffect(() => {
    if (editedRef.current) return;
    setAmount(String(myOffer?.amount ?? askedFare));
  }, [askedFare, myOffer?.amount]);

  const parsed = Number(amount.replace(",", "."));
  const inBand =
    Number.isFinite(parsed) &&
    parsed >= item.minFare &&
    parsed <= item.maxFare;

  // ----- the countdown ----------------------------------------------------
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const endsAt = useMemo(() => {
    const source = myOffer?.expiresAt ?? item.expiresAt;
    const parsedDate = new Date(source).getTime();
    return Number.isFinite(parsedDate) ? parsedDate : 0;
  }, [item.expiresAt, myOffer?.expiresAt]);

  const remainingMs = endsAt - now;
  const closed = endsAt > 0 && remainingMs <= 0;

  // The bar shrinks against the longest window this card has actually seen,
  // because the server does not send the original TTL.
  const spanRef = useRef(Math.max(1, remainingMs));
  if (remainingMs > spanRef.current) spanRef.current = remainingMs;
  const progress = Math.max(0, Math.min(1, remainingMs / spanRef.current));

  // ----- passenger --------------------------------------------------------
  const passenger = item.passenger as unknown as {
    name?: string | null;
    fullName?: string | null;
    photoUrl?: string | null;
    rating?: number | null;
    level?: string | null;
  } | null;

  const passengerName = passenger?.name ?? passenger?.fullName ?? null;
  const rawTier = (passenger?.level ?? "").toUpperCase();
  const tier = (rawTier in RANK_RING ? rawTier : null) as RankTier | null;

  const etaMinutes =
    item.durationSec != null ? Math.max(1, Math.round(item.durationSec / 60)) : null;
  const currency = item.currency;

  // ----- the pulsing ring on the waiting state ----------------------------
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!myOffer) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [myOffer, pulse]);

  const ringStyle = {
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
    transform: [
      {
        scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }),
      },
    ],
  };

  const commitAmount = (next: number) => {
    editedRef.current = true;
    setAmount(String(Math.min(item.maxFare, Math.round(next))));
  };

  // =======================================================================
  // WAITING STATE - screen_34
  // =======================================================================
  if (myOffer) {
    return (
      <View style={styles.card}>
        <View style={styles.waitingHead}>
          <View style={styles.hourglassWrap}>
            <Animated.View style={[styles.pulseRing, ringStyle]} />
            <View style={styles.hourglass}>
              <MaterialIcons
                name="hourglass-empty"
                size={ICON_SIZE.lg}
                color={COLORS.primary}
              />
            </View>
          </View>

          <Text style={styles.waitingTitle}>
            {passengerName
              ? `${requestStrings.waitingTitle} (${passengerName})`
              : requestStrings.waitingTitle}
          </Text>
          <Text style={styles.waitingBody}>{requestStrings.waitingBody}</Text>
        </View>

        {/* YOUR OFFER | EST. TIME, split by a vertical rule. */}
        <View style={styles.splitCard}>
          <View style={styles.splitCell}>
            <Text style={styles.splitLabel}>{requestStrings.yourOffer}</Text>
            <Text style={styles.splitValuePrimary}>
              {money(myOffer.amount)} {currency}
            </Text>
          </View>
          <View style={styles.splitRule} />
          <View style={[styles.splitCell, styles.splitCellEnd]}>
            <Text style={styles.splitLabel}>{requestStrings.estTime}</Text>
            <Text style={styles.splitValue}>
              {etaMinutes != null
                ? `${etaMinutes} ${requestStrings.minutesSuffix}`
                : "—"}
            </Text>
          </View>
        </View>

        <Text style={styles.countdownText}>
          {closed
            ? requestStrings.closed
            : `${requestStrings.closesIn} ${clock(remainingMs)}`}
        </Text>

        <View style={styles.stackedActions}>
          {onAccept ? (
            <PillButton
              label={`${requestStrings.acceptOriginal} (${money(askedFare)} ${currency})`}
              variant="secondary"
              onPress={() => onAccept(item.id)}
              disabled={busy || closed}
              loading={busy}
            />
          ) : null}
          <PillButton
            label={requestStrings.cancelNegotiation}
            variant="danger"
            onPress={() => onWithdraw(myOffer.id)}
            disabled={busy}
          />
        </View>
      </View>
    );
  }

  // =======================================================================
  // OFFER STATE - screen_19
  // =======================================================================
  return (
    <View style={styles.card}>
      {/* Passenger header + est. time */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <RankAvatar
            uri={passenger?.photoUrl ?? null}
            name={passengerName ?? undefined}
            tier={tier}
            rating={passenger?.rating ?? null}
            size={48}
          />
          <View style={styles.headerText}>
            <Text style={styles.name} numberOfLines={1}>
              {passengerName ?? requestStrings.passengerAsked}
            </Text>
            <Text style={styles.headerMeta} numberOfLines={1}>
              {item.driverDistanceKm != null
                ? `${item.driverDistanceKm.toFixed(1)} ${requestStrings.kmSuffix} ${requestStrings.awayFromYou}`
                : item.distanceKm != null
                  ? `${item.distanceKm.toFixed(1)} ${requestStrings.kmSuffix}`
                  : requestStrings.nearYou}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.headerMeta}>{requestStrings.estTime}</Text>
          <Text style={styles.eta}>
            {etaMinutes != null
              ? `${etaMinutes} ${requestStrings.minutesSuffix}`
              : "—"}
          </Text>
        </View>
      </View>

      {/* Route */}
      <View style={styles.routeBlock}>
        <RouteTimeline
          pickupLabel={requestStrings.pickup}
          pickup={item.pickupAddress ?? requestStrings.unknownAddress}
          destinationLabel={requestStrings.dropoff}
          destination={item.destAddress ?? requestStrings.unknownAddress}
        />
      </View>

      {item.passengerNote ? (
        <Text style={styles.note} numberOfLines={2}>
          {requestStrings.passengerNote}: {item.passengerNote}
        </Text>
      ) : null}

      {/* Negotiation area on its own raised surface, as in Stitch. */}
      <View style={styles.negotiation}>
        <View style={styles.heroWrap}>
          <Text style={styles.heroLabel}>{requestStrings.passengerOffer}</Text>
          <View style={styles.heroRow}>
            <Text style={styles.heroAmount}>{money(askedFare)}</Text>
            <Text style={styles.heroCurrency}>{currency}</Text>
          </View>
          <Text style={styles.bandHint}>
            {requestStrings.range}: {money(item.minFare)} – {money(item.maxFare)}{" "}
            {currency}
          </Text>
        </View>

        {/* Quick counters */}
        <View style={styles.quickRow}>
          {QUICK_STEPS.map((step) => (
            <Pressable
              key={step}
              accessibilityRole="button"
              disabled={busy || closed}
              onPress={() => commitAmount(askedFare + step)}
              style={({ pressed }) => [
                styles.quickChip,
                pressed ? styles.quickChipPressed : null,
                askedFare + step > item.maxFare ? styles.quickChipMuted : null,
              ]}
            >
              <Text style={styles.quickChipLabel}>+{step}</Text>
            </Pressable>
          ))}
        </View>

        {/* Custom amount, currency prefix outside the field like Stitch. */}
        <View style={styles.inputRow}>
          <Text style={styles.inputPrefix}>{currency}</Text>
          <TextInput
            value={amount}
            onChangeText={(next) => {
              editedRef.current = true;
              setAmount(next.replace(/[^0-9.,]/g, ""));
            }}
            keyboardType="numeric"
            editable={!busy && !closed}
            placeholder={requestStrings.customOffer}
            placeholderTextColor={alpha(COLORS.onSurfaceVariant, 0.5)}
            style={styles.input}
            // An amount is always LTR digits, in any interface language.
            textAlign="left"
          />
        </View>

        {!inBand && amount.length > 0 ? (
          <Text style={styles.error}>{requestStrings.outOfRange}</Text>
        ) : null}

        <View style={styles.stackedActions}>
          {onAccept ? (
            <PillButton
              label={`${requestStrings.acceptFare} ${money(askedFare)} ${currency}`}
              variant="primary"
              trailingIcon="check-circle"
              onPress={() => onAccept(item.id)}
              disabled={busy || closed}
              loading={busy}
            />
          ) : null}
          <PillButton
            label={busy ? requestStrings.sending : requestStrings.counterOffer}
            variant="secondary"
            onPress={() => onBid(item.id, Math.round(parsed * 100) / 100)}
            disabled={busy || closed || !inBand}
          />
        </View>

        {/* Shrinking countdown bar */}
        <View style={styles.countdownTrack}>
          <View style={[styles.countdownFill, { flex: progress }]} />
          <View style={{ flex: 1 - progress }} />
        </View>
        <Text style={styles.countdownText}>
          {closed
            ? requestStrings.closed
            : `${requestStrings.closesIn} ${clock(remainingMs)}`}
        </Text>
      </View>
    </View>
  );
}

export const FareOpportunityCard = React.memo(FareOpportunityCardBase);

const HOURGLASS = 56;

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.surfaceVariant,
    overflow: "hidden",
    paddingTop: SPACING.lg,
  },

  // ---- header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.md,
    paddingHorizontal: SPACING.container,
    paddingBottom: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: alpha(COLORS.outlineVariant, 0.4),
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    flexShrink: 1,
  },
  headerText: { flexShrink: 1 },
  name: { ...typo("titleMd"), color: COLORS.onSurface },
  headerMeta: { ...typo("labelSm"), color: COLORS.onSurfaceVariant },
  headerRight: { alignItems: "flex-end" },
  eta: { ...typo("titleMd"), color: COLORS.primary },

  // ---- route
  routeBlock: {
    paddingHorizontal: SPACING.container,
    paddingVertical: SPACING.lg,
  },
  note: {
    ...typo("labelSm"),
    color: COLORS.onSurfaceVariant,
    paddingHorizontal: SPACING.container,
    paddingBottom: SPACING.md,
  },

  // ---- negotiation block
  negotiation: {
    backgroundColor: COLORS.surfaceContainerHigh,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: alpha(COLORS.outlineVariant, 0.4),
    paddingHorizontal: SPACING.container,
    paddingVertical: SPACING.xl,
    gap: SPACING.lg,
  },
  heroWrap: { alignItems: "center", gap: SPACING.xs },
  heroLabel: {
    ...typo("labelMd"),
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1,
  },
  heroRow: { flexDirection: "row", alignItems: "flex-end", gap: SPACING.xs },
  heroAmount: { ...typo("headlineXl"), color: COLORS.onSurface },
  heroCurrency: {
    ...typo("titleMd"),
    color: COLORS.onSurfaceVariant,
    marginBottom: SPACING.xs,
  },
  bandHint: { ...typo("labelSm"), color: COLORS.onSurfaceVariant },

  // ---- quick chips
  quickRow: { flexDirection: "row", gap: SPACING.sm },
  quickChip: {
    flex: 1,
    height: TOUCH_TARGET,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceVariant,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  quickChipPressed: { borderColor: alpha(COLORS.primary, 0.5) },
  quickChipMuted: { opacity: 0.45 },
  quickChipLabel: { ...typo("labelMd"), color: COLORS.onSurface },

  // ---- custom input
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.surfaceVariant,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  inputPrefix: { ...typo("labelMd"), color: COLORS.onSurfaceVariant },
  input: {
    flex: 1,
    ...typo("bodyLg"),
    color: COLORS.onSurface,
    // An amount must never mirror, whatever the interface direction is.
    writingDirection: "ltr",
  },
  error: { ...typo("labelSm"), color: COLORS.error },

  stackedActions: { gap: SPACING.md },

  // ---- countdown
  countdownTrack: {
    flexDirection: "row",
    height: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    overflow: "hidden",
  },
  countdownFill: { backgroundColor: COLORS.primary },
  countdownText: {
    ...typo("labelSm"),
    color: COLORS.onSurfaceVariant,
    textAlign: "center",
  },

  // ---- waiting state
  waitingHead: {
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.container,
    paddingBottom: SPACING.lg,
  },
  hourglassWrap: {
    width: HOURGLASS + 24,
    height: HOURGLASS + 24,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: HOURGLASS + 24,
    height: HOURGLASS + 24,
    borderRadius: RADIUS.full,
    borderWidth: 4,
    borderColor: alpha(COLORS.primary, 0.25),
  },
  hourglass: {
    width: HOURGLASS,
    height: HOURGLASS,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
    ...GLOW_PRIMARY,
  },
  waitingTitle: {
    ...typo("titleMd"),
    color: COLORS.onSurface,
    textAlign: "center",
  },
  waitingBody: {
    ...typo("bodyMd"),
    color: COLORS.onSurfaceVariant,
    textAlign: "center",
  },
  splitCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: SPACING.container,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: alpha(COLORS.primary, 0.2),
    backgroundColor: COLORS.surface,
  },
  splitCell: { flex: 1, gap: 2 },
  splitCellEnd: { alignItems: "flex-end" },
  splitRule: {
    width: StyleSheet.hairlineWidth,
    height: 40,
    backgroundColor: COLORS.surfaceVariant,
    marginHorizontal: SPACING.md,
  },
  splitLabel: {
    ...typo("labelSm"),
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1,
  },
  splitValue: { ...typo("titleMd"), color: COLORS.onSurface },
  splitValuePrimary: { ...typo("headlineLgMobile"), color: COLORS.primary },
});
