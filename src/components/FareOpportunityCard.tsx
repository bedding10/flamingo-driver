import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import type { FareOpportunity } from "../types/fareOffer";
import { requestStrings } from "../i18n/strings.requests";
import {
  AppText,
  Badge,
  Button,
  Card,
  Input,
  Money,
  formatAmount,
  formatClock,
  formatDistanceKm,
  formatMinutes,
  formatMoney,
  rtlRow,
} from "../ui";
import { radius, spacing, usePalette, type Palette } from "../theme";

type Props = {
  item: FareOpportunity;
  /** True while this card's bid, withdrawal, claim or report is in flight. */
  busy: boolean;
  onBid: (quoteId: string, amount: number) => void;
  onWithdraw: (offerId: string) => void;
  onDirectAccept: (quoteId: string, amount?: number) => void;
  onHide: (quoteId: string) => void;
  onReport: (item: FareOpportunity) => void;
};

/**
 * One open bidding request, drawn with the design system.
 *
 * Three server capabilities that existed in the hook but had no UI are exposed
 * here: direct accept, hide, and report.
 *
 * The amount is validated against the server's own band ([minFare, maxFare],
 * returned with the request) so the driver is never sent into a guaranteed
 * FARE_OFFER_OUT_OF_RANGE. Nothing else is computed locally - in particular the
 * driver's net is NOT derived from commissionPct, because the settlement side
 * subtracts coupon shares the quote does not carry.
 */
function FareOpportunityCardComponent({
  item,
  busy,
  onBid,
  onWithdraw,
  onDirectAccept,
  onHide,
  onReport,
}: Props) {
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);

  // Narrowed once into a local: this keeps the JSX free of non-null assertions,
  // which `npm run lint` (--max-warnings=0) would flag.
  const myOffer = item.myOffer;
  const askedFare = item.proposedFare ?? item.suggestedFare;
  const initial = myOffer?.amount ?? askedFare;
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
    Number.isFinite(parsed) && parsed >= item.minFare && parsed <= item.maxFare;
  const bidAmount = Math.round(parsed * 100) / 100;
  const pending = myOffer?.status === "PENDING";
  // POST /support/complaints needs againstUserId; the passenger id is optional
  // on the quote, so the action is hidden rather than failing on tap.
  const canReport = Boolean(item.passenger?.id);

  return (
    <Card style={expired ? styles.expired : undefined}>
      <View style={styles.body}>
        <View style={styles.headRow}>
          <AppText variant="subtitle" numberOfLines={1} style={styles.name}>
            {item.passenger?.name ?? requestStrings.title}
          </AppText>
          <Badge
            icon="timer"
            tone={expired ? "neutral" : "brand"}
            label={
              expired
                ? requestStrings.closed
                : `${requestStrings.closesIn} ${formatClock(remaining)}`
            }
          />
        </View>

        <View style={styles.fareRow}>
          <Money
            amount={askedFare}
            currency={item.currency}
            decimals={0}
            variant="display"
            tone="primary"
          />
          <AppText variant="caption" tone="secondary" style={styles.fareLabel}>
            {item.proposedFare != null
              ? requestStrings.passengerAsked
              : requestStrings.suggested}
          </AppText>
        </View>

        <View style={styles.chips}>
          {item.driverDistanceKm != null ? (
            <Badge
              icon="navigate"
              tone="info"
              label={`${formatDistanceKm(item.driverDistanceKm)} ${requestStrings.awayFromYou}`}
            />
          ) : null}
          {item.distanceKm != null ? (
            <Badge icon="place" label={formatDistanceKm(item.distanceKm)} />
          ) : null}
          {item.durationSec != null ? (
            <Badge icon="clock" label={formatMinutes(item.durationSec / 60)} />
          ) : null}
          {item.commissionPct != null ? (
            <Badge
              icon="receipt"
              tone="warning"
              label={`${requestStrings.commission} ${item.commissionPct}%`}
            />
          ) : null}
        </View>

        <View style={styles.leg}>
          <View style={[styles.dot, styles.dotPickup]} />
          <View style={styles.legText}>
            <AppText variant="caption" tone="secondary">
              {requestStrings.pickup}
            </AppText>
            <AppText numberOfLines={2}>
              {item.pickupAddress || requestStrings.unknownAddress}
            </AppText>
          </View>
        </View>

        <View style={styles.leg}>
          <View style={[styles.dot, styles.dotDrop]} />
          <View style={styles.legText}>
            <AppText variant="caption" tone="secondary">
              {requestStrings.dropoff}
            </AppText>
            <AppText numberOfLines={2}>
              {item.destAddress || requestStrings.unknownAddress}
            </AppText>
          </View>
        </View>

        {item.passengerNote ? (
          <AppText variant="caption" tone="secondary" numberOfLines={3}>
            {`${requestStrings.passengerNote}: ${item.passengerNote}`}
          </AppText>
        ) : null}

        {myOffer && pending ? (
          <AppText variant="caption" tone="brand">
            {`${requestStrings.myOfferAmount} ${formatMoney(myOffer.amount, myOffer.currency, 0)} · ${requestStrings.myOfferPending}`}
          </AppText>
        ) : null}

        <Input
          label={requestStrings.amountLabel}
          value={amount}
          onChangeText={(text) => {
            editedRef.current = true;
            setAmount(text.replace(/[^0-9.]/g, ""));
          }}
          keyboardType="numeric"
          editable={!expired && !busy}
          placeholder={requestStrings.amountPlaceholder}
          hint={`${requestStrings.range} ${formatAmount(item.minFare, 0)} – ${formatMoney(item.maxFare, item.currency, 0)}`}
          error={!valid && !expired ? requestStrings.outOfRange : undefined}
        />

        {/*
         * Direct accept is the primary action by project-owner decision: the
         * request becomes this driver's trip immediately, with no confirmation
         * step. Sending the typed amount when it is inside the band means the
         * button always charges what the field shows; omitting it would silently
         * take the passenger's ask instead.
         */}
        <Button
          label={requestStrings.directAccept}
          icon="check"
          loading={busy}
          disabled={busy || expired}
          onPress={() => onDirectAccept(item.id, valid ? bidAmount : undefined)}
        />

        <View style={styles.actions}>
          <Button
            style={styles.grow}
            variant="secondary"
            size="md"
            icon="negotiate"
            label={pending ? requestStrings.update : requestStrings.send}
            disabled={busy || expired || !valid}
            onPress={() => onBid(item.id, bidAmount)}
          />
          {myOffer && pending ? (
            <Button
              variant="ghost"
              size="md"
              icon="close"
              label={requestStrings.withdraw}
              disabled={busy}
              onPress={() => onWithdraw(myOffer.id)}
            />
          ) : null}
        </View>

        {/*
         * The hook calls these "swipe actions", but a swipeable row needs a
         * gesture wrapper this list does not have, and a hidden gesture is a
         * poor home for "report". They are visible tertiary buttons instead.
         */}
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
    </Card>
  );
}

export const FareOpportunityCard = React.memo(FareOpportunityCardComponent);

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    expired: { opacity: 0.55 },
    body: { gap: spacing.md },

    headRow: {
      ...rtlRow,
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    name: { flexShrink: 1 },

    fareRow: {
      ...rtlRow,
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    fareLabel: { flexShrink: 1 },

    chips: { ...rtlRow, flexWrap: "wrap", gap: spacing.sm },

    leg: { ...rtlRow, alignItems: "flex-start", gap: spacing.md },
    dot: { width: 10, height: 10, borderRadius: radius.pill, marginTop: 6 },
    dotPickup: { backgroundColor: palette.online },
    dotDrop: { backgroundColor: palette.danger },
    legText: { flex: 1, gap: 2 },

    actions: { ...rtlRow, gap: spacing.md },
    tertiary: { ...rtlRow, gap: spacing.sm, justifyContent: "flex-start" },
    grow: { flex: 1 },
  });
