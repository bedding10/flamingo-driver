import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { ProfileAvatar } from "./ProfileAvatar";
import type { RideOffer } from "../types/trip";
import { strings } from "../i18n/strings";
import { offer75Strings, rideClassLabels } from "../i18n/strings.phase75";
import {
  AppText,
  Badge,
  Button,
  CountdownRing,
  Money,
  rtlRow,
  useCountdown,
} from "../ui";
import { radius, shadows, spacing, usePalette } from "../theme";

type Props = {
  offer: RideOffer;
  awaiting: boolean;
  notice: string | null;
  bottomInset: number;
  onAccept: (tripId: string) => void;
  onDecline: (tripId: string) => void;
};

/**
 * The ride offer card.
 *
 * DESIGN PHASE: rebuilt on the design system. The card used to carry its own
 * linear timer, its own money formatter, its own text styles and two bespoke
 * Pressables - the single biggest source of drift in the app, because the most
 * important screen looked like nothing else. It now uses CountdownRing, Money,
 * Badge, AppText and Button. The props, the callbacks and the decision flow are
 * unchanged, so DriverHomeScreen did not have to be touched.
 *
 * It stays a floating card inset from the edges rather than a full-bleed sheet:
 * a driver decides on an offer by looking at WHERE it is, so the map and the
 * pickup pin must stay visible behind it.
 *
 * Three deliberate omissions, all for the same reason - the server does not
 * send them and inventing them would mislead the person deciding:
 *  - rating COUNT: `passenger.rating` arrives without a sample size.
 *  - distance to the passenger and ETA: `ride:offer` carries the trip distance
 *    (`distanceKm`) only, so that is what is labelled. No haversine is computed
 *    from the last GPS fix and passed off as a routed distance.
 *  - "suggest a fare": the gateway accepts ride:accept and ride:decline only.
 *    Fare bidding is the open-requests flow, so the card says where it lives
 *    instead of showing a button that can send nothing.
 *
 * The countdown is driven by `offer.expiresInMs`, sent with every offer, never
 * by a constant: OFFER_TIMEOUT_MS lives in MatchingService and can be retuned
 * server side, and a driver who trusts a wrong timer loses rides. It is turned
 * into a wall-clock deadline, so a re-render or a stalled JS thread cannot make
 * the ring disagree with the backend.
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
  const [deadline, setDeadline] = useState(() => Date.now() + total);

  // Re-armed per offer: a new tripId is a new deadline.
  useEffect(() => {
    setDeadline(Date.now() + total);
  }, [offer.tripId, total]);

  const { remainingSec, progress } = useCountdown(deadline, total);

  // The net is authoritative from the backend (`driverNet`), computed with the
  // same settlement math as the wallet. The app must NOT recompute it: a local
  // fare - fare*pct/100 diverges the moment a coupon is involved.
  const commissionPct = offer.commissionPct ?? 0;
  const net = offer.driverNet ?? null;

  const passenger = offer.passenger ?? null;
  const rideClassLabel = offer.rideClass
    ? (rideClassLabels[offer.rideClass] ?? offer.rideClass)
    : null;

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
      {/* Head: what it is, how long is left, what it pays. */}
      <View style={styles.headRow}>
        <CountdownRing
          progress={progress}
          label={String(remainingSec)}
          size={64}
        />

        <View style={styles.headText}>
          <AppText variant="label" tone="brand">
            {offer75Strings.newRequest}
          </AppText>
          <Money
            amount={offer.fare}
            currency={offer.currency ?? undefined}
            decimals={0}
            tone="primary"
            align="right"
          />
          {net != null && commissionPct > 0 ? (
            <AppText variant="caption" tone="success">
              {`${offer75Strings.netLabel} ${Math.round(net)} ${
                offer.currency ?? ""
              } \u00b7 ${offer75Strings.commissionLabel} ${commissionPct}%`}
            </AppText>
          ) : null}
        </View>
      </View>

      {/* Passenger identity, with the tier frame the backend awarded. */}
      <View style={styles.passengerRow}>
        <ProfileAvatar
          avatarUrl={passenger?.avatarUrl}
          frameUrl={passenger?.profileFrameUrl}
          size={44}
          fallback={passenger?.name ?? offer75Strings.passengerFallback}
          accessibilityLabel={passenger?.name ?? offer75Strings.passengerFallback}
        />
        <View style={styles.passengerText}>
          <AppText variant="subtitle" numberOfLines={1}>
            {passenger?.name || offer75Strings.passengerFallback}
          </AppText>
          <View style={styles.chips}>
            {passenger?.rating != null ? (
              <Badge
                label={passenger.rating.toFixed(1)}
                tone="neutral"
                icon="star"
              />
            ) : null}
            {passenger?.completedTripsCount != null ? (
              <AppText variant="caption" tone="secondary">
                {`${passenger.completedTripsCount} ${offer75Strings.completedShort}`}
              </AppText>
            ) : null}
          </View>
        </View>
      </View>

      {/* Trip facts the server actually sent. */}
      {offer.distanceKm != null || rideClassLabel ? (
        <View style={styles.chips}>
          {offer.distanceKm != null ? (
            <Badge
              label={`${offer75Strings.tripDistance} ${offer.distanceKm.toFixed(
                1,
              )} ${strings.offer.kmSuffix}`}
              tone="info"
              icon="navigate"
            />
          ) : null}
          {rideClassLabel ? (
            <Badge label={rideClassLabel} tone="neutral" icon="car" />
          ) : null}
        </View>
      ) : null}

      <View style={styles.leg}>
        <View style={[styles.dot, { backgroundColor: palette.online }]} />
        <AppText numberOfLines={1} style={styles.legText}>
          {offer.pickupAddress || strings.offer.unknownAddress}
        </AppText>
      </View>
      <View style={styles.leg}>
        <View style={[styles.dot, { backgroundColor: palette.primary }]} />
        <AppText tone="secondary" numberOfLines={1} style={styles.legText}>
          {offer.destAddress || strings.offer.unknownAddress}
        </AppText>
      </View>

      {notice ? (
        <AppText variant="caption" tone="warning">
          {notice}
        </AppText>
      ) : null}

      {/* Accept is the only filled action on the screen; skip stays quiet. */}
      <View style={styles.actions}>
        <Button
          label={offer75Strings.skip}
          variant="secondary"
          size="lg"
          disabled={awaiting}
          onPress={() => onDecline(offer.tripId)}
          style={styles.skip}
        />
        <Button
          label={awaiting ? offer75Strings.awaiting : offer75Strings.accept}
          variant="primary"
          size="lg"
          loading={awaiting}
          onPress={() => onAccept(offer.tripId)}
          style={styles.accept}
        />
      </View>

      <AppText variant="caption" tone="muted">
        {offer75Strings.bidElsewhere}
      </AppText>
    </View>
  );
}

export const RideOfferCard = React.memo(RideOfferCardComponent);

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    left: 14,
    right: 14,
    borderRadius: radius.sheet,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    ...shadows.floating,
  },

  headRow: { ...rtlRow, alignItems: "center", gap: spacing.md },
  headText: { flex: 1, gap: 2 },

  passengerRow: { ...rtlRow, alignItems: "center", gap: spacing.md },
  passengerText: { flex: 1, gap: spacing.xs },
  chips: { ...rtlRow, alignItems: "center", flexWrap: "wrap", gap: spacing.sm },

  leg: { ...rtlRow, alignItems: "center", gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legText: { flex: 1 },

  actions: { ...rtlRow, gap: spacing.md, marginTop: spacing.xs },
  accept: { flex: 2 },
  skip: { flex: 1 },
});
