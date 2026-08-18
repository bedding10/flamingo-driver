import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import type { FareOpportunity } from "../types/fareOffer";
import { requestStrings } from "../i18n/strings.requests";
import { Icon } from "./Icon";
import { toDriverLevel } from "./DriverTopBar";
import {
  AppText,
  Badge,
  Button,
  LevelAvatar,
  Money,
  formatClock,
  formatDistanceKm,
  formatMoney,
  rtlRow,
} from "../ui";
import {
  radius,
  shadows,
  spacing,
  usePalette,
  type Palette,
} from "../theme";

type Props = {
  item: FareOpportunity;
  /** True while this card's accept, hide or report is in flight. */
  busy: boolean;
  onNegotiate: (item: FareOpportunity) => void;
  onDirectAccept: (quoteId: string, amount?: number) => void;
  onHide: (quoteId: string) => void;
  onReport: (item: FareOpportunity) => void;
};

/**
 * One open bidding request, rebuilt as the `available_requests` card.
 *
 * THE REFERENCE CARD, verbatim:
 *
 *   article  bg-surface-container rounded-[24px] p-5 shadow-2xl
 *   row 1    img w-14 h-14 rounded-full profile-frame-silver p-0.5
 *              + chip absolute -bottom-2 -right-1 bg-surface-container px-1.5
 *                py-0.5 rounded-full border border-surface-variant
 *                  -> star text-yellow-500 + "4.8"
 *            h3 font-title-md truncate                  -> name
 *            p  font-label-md text-on-surface-variant    -> "120 trips"
 *            p  font-headline-lg-mobile text-primary-container -> "850 DZD"
 *            p  font-label-sm text-on-surface-variant + near_me text-[14px]
 *                                                       -> "1.2 km away"
 *   timeline relative pl-3 before:w-[2px] before:bg-surface-variant
 *            node w-6 h-6 rounded-full bg-surface-container border-2
 *                 border-primary-container -left-[14px]
 *              first: inner w-2 h-2 bg-primary-container
 *              second: location_on text-[14px] text-primary-container
 *            label font-label-sm text-on-surface-variant + value font-body-md
 *   footer   flex gap-3: outline "Negotiate" + solid pink "Accept",
 *            both flex-1 min-h-[48px] rounded-full
 *
 * WHAT THIS DELETES, and it is the whole point: the card used to carry a numeric
 * keyboard, a range hint, an error line and five buttons. The reference card has
 * two buttons and no input. The amount now lives in NegotiateSheet, which is the
 * reference's own answer (`ride_negotiation_offer` is a sheet, not a card), and
 * "Accept" still goes through the confirmation the owner asked for.
 *
 * FOUR THINGS THE REFERENCE CARD DOES NOT HAVE, kept because they carry real
 * server data a driver acts on, and all four are hidden when the server says
 * nothing:
 *
 *  - the ask/suggested caption. `proposedFare` and `suggestedFare` are different
 *    facts: one is the passenger's price, the other is ours. The reference mock
 *    has a single hardcoded number and never has to say which it is.
 *  - the passenger note.
 *  - the current-bid line, when this driver already has a PENDING offer.
 *  - a countdown, and only in the last minute or after expiry. A request that
 *    expires while the driver reads it is otherwise silent, and tapping it can
 *    only fail with FARE_QUOTE_EXPIRED.
 *
 * Hide and report stay as small ghost actions: both are real server
 * capabilities the hook exposes, and a hidden gesture is a poor home for a
 * report.
 *
 * Two forced translations: the rating chip mirrors to the avatar's bottom-LEFT
 * because this app mirrors with `row-reverse` rather than I18nManager, and the
 * silver frame is drawn by LevelAvatar from the passenger's own
 * `profileLevel` - the reference hardcodes silver on every card, which would be
 * a lie about a tier the server actually reports.
 */
function FareOpportunityCardComponent({
  item,
  busy,
  onNegotiate,
  onDirectAccept,
  onHide,
  onReport,
}: Props) {
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);

  const passenger = item.passenger;
  const myOffer = item.myOffer;
  const pending = myOffer?.status === "PENDING";
  const askedFare = item.proposedFare ?? item.suggestedFare;
  const level = toDriverLevel(passenger?.profileLevel);
  // POST /support/complaints needs againstUserId; the passenger id is optional
  // on the quote, so the action is hidden rather than failing on tap.
  const canReport = Boolean(passenger?.id);

  // Ticking `now` instead of storing the remainder: the countdown is then
  // derived on every render and the first frame can never show a stale zero.
  const deadline = useMemo(
    () => new Date(item.expiresAt).getTime(),
    [item.expiresAt],
  );
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  const remaining = deadline - now;
  const expired = remaining <= 0;
  const urgent = remaining > 0 && remaining <= 60_000;

  return (
    <View style={[styles.card, expired ? styles.expired : null]}>
      <View style={styles.topRow}>
        <View style={styles.avatarWrap}>
          <LevelAvatar
            name={passenger?.name ?? requestStrings.title}
            uri={passenger?.avatarUrl}
            level={level}
            size={level ? 48 : 56}
          />
          {passenger?.rating != null ? (
            <View style={styles.ratingChip}>
              <Icon name="star" size={12} color={palette.warning} />
              <AppText variant="caption">{passenger.rating.toFixed(1)}</AppText>
            </View>
          ) : null}
        </View>

        <View style={styles.identity}>
          <AppText variant="title" numberOfLines={1}>
            {passenger?.name ?? requestStrings.title}
          </AppText>
          {passenger?.completedTripsCount != null ? (
            <AppText variant="label" tone="secondary">
              {`${passenger.completedTripsCount} ${requestStrings.tripsSuffix}`}
            </AppText>
          ) : null}
        </View>

        <View style={styles.fareCol}>
          <Money
            amount={askedFare}
            currency={item.currency}
            decimals={0}
            variant="headline"
            style={styles.fare}
          />
          {item.driverDistanceKm != null ? (
            <View style={styles.distanceRow}>
              <Icon name="navigate" size={14} color={palette.textSecondary} />
              <AppText variant="caption" tone="secondary">
                {`${formatDistanceKm(item.driverDistanceKm)} ${requestStrings.awayFromYou}`}
              </AppText>
            </View>
          ) : null}
          <AppText variant="caption" tone="secondary">
            {item.proposedFare != null
              ? requestStrings.passengerAsked
              : requestStrings.suggested}
          </AppText>
        </View>
      </View>

      <View style={styles.timeline}>
        <View style={styles.timelineLine} />

        <View style={styles.legRow}>
          <View style={styles.node}>
            <View style={styles.nodeDot} />
          </View>
          <View style={styles.legText}>
            <AppText variant="caption" tone="secondary">
              {requestStrings.pickup}
            </AppText>
            <AppText numberOfLines={2}>
              {item.pickupAddress || requestStrings.unknownAddress}
            </AppText>
          </View>
        </View>

        <View style={styles.legRow}>
          <View style={styles.node}>
            <Icon name="place" size={14} color={palette.primary} />
          </View>
          <View style={styles.legText}>
            <AppText variant="caption" tone="secondary">
              {requestStrings.dropoff}
            </AppText>
            <AppText numberOfLines={2}>
              {item.destAddress || requestStrings.unknownAddress}
            </AppText>
          </View>
        </View>
      </View>

      {item.passengerNote ? (
        <AppText variant="caption" tone="secondary" numberOfLines={3}>
          {`${requestStrings.passengerNote}: ${item.passengerNote}`}
        </AppText>
      ) : null}

      {pending && myOffer ? (
        <AppText variant="caption" tone="brand">
          {`${requestStrings.myOfferAmount} ${formatMoney(myOffer.amount, myOffer.currency, 0)}`}
        </AppText>
      ) : null}

      {expired ? <Badge icon="timer" label={requestStrings.closed} /> : null}
      {urgent ? (
        <Badge
          icon="timer"
          tone="warning"
          label={`${requestStrings.closesIn} ${formatClock(remaining)}`}
        />
      ) : null}

      <View style={styles.footer}>
        <Button
          style={styles.grow}
          size="sm"
          variant="secondary"
          label={pending ? requestStrings.update : requestStrings.negotiate}
          disabled={busy || expired}
          onPress={() => onNegotiate(item)}
        />
        {/*
         * Direct accept sends this driver's OWN pending amount when they have
         * one, so the button charges the price they negotiated rather than
         * silently reverting to the passenger's ask. With no bid on the table it
         * sends nothing and the server applies the ask itself.
         */}
        <Button
          style={styles.grow}
          size="sm"
          variant="primary"
          label={requestStrings.directAccept}
          loading={busy}
          disabled={busy || expired}
          onPress={() =>
            onDirectAccept(item.id, pending ? myOffer?.amount : undefined)
          }
        />
      </View>

      <View style={styles.tertiary}>
        <Button
          variant="ghost"
          size="sm"
          icon="eyeOff"
          label={requestStrings.hide}
          disabled={busy}
          onPress={() => onHide(item.id)}
        />
        {canReport ? (
          <Button
            variant="ghost"
            size="sm"
            icon="flag"
            label={requestStrings.report}
            disabled={busy}
            onPress={() => onReport(item)}
          />
        ) : null}
      </View>
    </View>
  );
}

export const FareOpportunityCard = React.memo(FareOpportunityCardComponent);

/** Reference: w-6 h-6 node, -left-[14px] over a 2px rail. */
const NODE = 24;

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    card: {
      backgroundColor: palette.surface,
      borderRadius: radius.sheet,
      padding: spacing.xl,
      gap: spacing.lg,
      ...shadows.card,
    },
    expired: { opacity: 0.55 },

    topRow: { ...rtlRow, alignItems: "flex-start", gap: spacing.md },
    avatarWrap: { position: "relative" },
    ratingChip: {
      position: "absolute",
      bottom: -6,
      left: -4,
      flexDirection: "row-reverse",
      alignItems: "center",
      gap: 2,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.pill,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.surfaceVariant,
    },
    identity: { flex: 1, gap: 2 },
    fareCol: { alignItems: "flex-start", gap: 2 },
    fare: { color: palette.primary },
    distanceRow: { ...rtlRow, alignItems: "center", gap: 4 },

    timeline: { position: "relative", gap: spacing.lg },
    timelineLine: {
      position: "absolute",
      top: NODE / 2,
      bottom: NODE / 2,
      right: NODE / 2 - 1,
      width: 2,
      backgroundColor: palette.surfaceVariant,
    },
    legRow: { ...rtlRow, alignItems: "flex-start", gap: spacing.md },
    node: {
      width: NODE,
      height: NODE,
      borderRadius: radius.pill,
      borderWidth: 2,
      borderColor: palette.primary,
      backgroundColor: palette.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    nodeDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: palette.primary,
    },
    legText: { flex: 1, gap: 2 },

    footer: { ...rtlRow, gap: spacing.md },
    grow: { flex: 1 },
    tertiary: { ...rtlRow, gap: spacing.sm, justifyContent: "flex-start" },
  });
