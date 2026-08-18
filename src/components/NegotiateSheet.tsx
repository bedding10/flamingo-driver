import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import type { FareOpportunity } from "../types/fareOffer";
import { requestStrings } from "../i18n/strings.requests";
import { Icon } from "./Icon";
import { toDriverLevel } from "./DriverTopBar";
import {
  AppText,
  BottomSheet,
  Button,
  Input,
  LevelAvatar,
  Money,
  formatClock,
  formatDistanceKm,
  formatMinutes,
  formatMoney,
  rtlRow,
} from "../ui";
import {
  layout,
  radius,
  spacing,
  usePalette,
  withAlpha,
  type Palette,
} from "../theme";

/** Reference quick-adds: three buttons, +50 / +100 / +150. */
const BUMPS = [50, 100, 150] as const;

/**
 * Bidding, moved out of the list card and into the reference's own sheet.
 *
 * THE REFERENCE, `ride_negotiation_offer.html`, top to bottom:
 *
 *   sheet   bg-surface-container/85 backdrop-blur-[20px] rounded-t-2xl
 *           + handle w-10 h-1 bg-surface-variant
 *   header  px-container-padding pt-4 pb-3 border-b border-white/5
 *             img w-12 h-12 rounded-full border-2 border-surface-variant
 *               + chip -bottom-1 -right-1 with star text-yellow-400 text-[12px]
 *             h2 font-title-md "Ahmed"
 *             row font-label-sm text-on-surface-variant:
 *               star text-[14px] + "4.8" | "2 min away (0.8km)"
 *             right column: font-label-sm "Est. Time"
 *               + font-title-md text-primary "14 min"
 *   route   radio_button_checked text-[20px] on-surface-variant + body-md
 *           address over label-sm "Pickup Location"
 *           connector ml-2.5 w-0.5 h-4 bg-surface-variant
 *           location_on text-[20px] text-primary + dropoff
 *   offer   bg-surface-container-high px-container-padding py-5 gap-5
 *           rounded-t-xl border-t border-white/5
 *             label-md on-surface-variant "Passenger Offer"
 *             font-headline-xl text-white "850" + title-md variant "DZD"
 *             three h-12 bg-surface rounded-lg border buttons: +50 +100 +150
 *             input h-14 bg-surface rounded-xl with a DZD prefix
 *             h-14 pink pill "Accept 850 DZD" + check_circle
 *             h-14 transparent border-2 pill "Send Counter-offer"
 *             a 15s shrinking progress bar
 *
 * FOUR DELIBERATE DIVERGENCES, all of them decisions rather than shortcuts:
 *
 * 1. NO "ACCEPT" BUTTON IN THIS SHEET. The reference puts accept and counter-
 *    offer side by side. In this app accept is irreversible - it creates the
 *    trip, flips availability to ON_TRIP and cannot be undone from the app - and
 *    the owner asked for a confirmation in front of it. Stacking that
 *    confirmation on top of this sheet is two modals deep. Accept therefore
 *    stays on the card, where it opens ConfirmAcceptSheet; this sheet owns the
 *    one safe action, the bid, plus withdrawing it.
 * 2. NO BLUR. `backdrop-blur-[20px]` needs expo-blur, which is not a dependency
 *    of this project, so the sheet is the opaque surface BottomSheet already
 *    draws.
 * 3. THE AMOUNT IS ONE STRING. The reference splits "850" and "DZD" across two
 *    sizes; Money formats both together so a fare is punctuated identically on
 *    every screen. It keeps the reference's headline-xl size.
 * 4. THE COUNTDOWN IS A NUMBER, NOT A BAR. The reference bar animates a
 *    hardcoded 15s. The real deadline is the quote's `expiresAt`, or the
 *    driver's own offer expiry when that lands sooner, so the exact remaining
 *    time is printed instead of an animation that would be a decoration.
 *
 * The DZD prefix inside the field is also dropped: the kit's Input has a label,
 * a hint and an error, and the currency is stated by the label and by the range
 * hint under it, which is the honest place for it.
 */
export function NegotiateSheet({
  item,
  busy,
  onClose,
  onBid,
  onWithdraw,
}: {
  item: FareOpportunity | null;
  busy: boolean;
  onClose: () => void;
  onBid: (quoteId: string, amount: number) => void;
  onWithdraw: (offerId: string) => void;
}) {
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);

  const quoteId = item?.id ?? null;
  const myOffer = item?.myOffer ?? null;
  const pending = myOffer?.status === "PENDING";
  const asked = item ? (item.proposedFare ?? item.suggestedFare) : 0;

  // The field is seeded from the driver's live offer when they have one, and
  // from the ask when they do not - and it is re-seeded only when the sheet
  // moves to a different request, never while they are typing in it.
  const [amount, setAmount] = useState("");
  useEffect(() => {
    if (!quoteId) return;
    setAmount(String(Math.round(myOffer?.amount ?? asked)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteId]);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!quoteId) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [quoteId]);

  const deadline = useMemo(() => {
    if (!item) return 0;
    const quote = new Date(item.expiresAt).getTime();
    const offer =
      pending && myOffer ? new Date(myOffer.expiresAt).getTime() : 0;
    return offer > 0 ? Math.min(quote, offer) : quote;
  }, [item, myOffer, pending]);

  const remaining = deadline - now;
  const expired = deadline > 0 && remaining <= 0;

  const parsed = Number(amount);
  const inRange =
    item != null &&
    Number.isFinite(parsed) &&
    parsed >= item.minFare &&
    parsed <= item.maxFare;
  const touched = amount.trim().length > 0;

  const bump = (step: number) => {
    if (!item) return;
    const base = Number.isFinite(parsed) && parsed > 0 ? parsed : asked;
    setAmount(String(Math.min(item.maxFare, Math.round(base + step))));
  };

  return (
    <Modal
      visible={item != null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={requestStrings.confirmCancel}
          onPress={onClose}
          style={styles.backdrop}
        />

        <BottomSheet>
          {item ? (
            <View style={styles.body}>
              <View style={styles.header}>
                <View style={styles.avatarWrap}>
                  <LevelAvatar
                    name={item.passenger?.name ?? requestStrings.title}
                    uri={item.passenger?.avatarUrl}
                    level={toDriverLevel(item.passenger?.profileLevel)}
                    size={40}
                  />
                  {item.passenger?.rating != null ? (
                    <View style={styles.ratingChip}>
                      <Icon name="star" size={12} color={palette.warning} />
                    </View>
                  ) : null}
                </View>

                <View style={styles.identity}>
                  <AppText variant="title" numberOfLines={1}>
                    {item.passenger?.name ?? requestStrings.title}
                  </AppText>
                  <View style={styles.metaRow}>
                    {item.passenger?.rating != null ? (
                      <AppText variant="caption" tone="secondary">
                        {`\u2605 ${item.passenger.rating.toFixed(1)}`}
                      </AppText>
                    ) : null}
                    {item.driverDistanceKm != null ? (
                      <AppText variant="caption" tone="secondary">
                        {`${formatDistanceKm(item.driverDistanceKm)} ${requestStrings.awayFromYou}`}
                      </AppText>
                    ) : null}
                  </View>
                </View>

                {item.durationSec != null ? (
                  <View style={styles.etaCol}>
                    <AppText variant="caption" tone="secondary">
                      {requestStrings.duration}
                    </AppText>
                    <AppText variant="title" tone="brand">
                      {formatMinutes(item.durationSec / 60)}
                    </AppText>
                  </View>
                ) : null}
              </View>

              <View style={styles.divider} />

              <View style={styles.route}>
                <View style={styles.legRow}>
                  <Icon name="target" size={20} color={palette.textSecondary} />
                  <View style={styles.legText}>
                    <AppText numberOfLines={2}>
                      {item.pickupAddress || requestStrings.unknownAddress}
                    </AppText>
                    <AppText variant="caption" tone="secondary">
                      {requestStrings.pickup}
                    </AppText>
                  </View>
                </View>

                <View style={styles.connector} />

                <View style={styles.legRow}>
                  <Icon name="place" size={20} color={palette.primary} />
                  <View style={styles.legText}>
                    <AppText numberOfLines={2}>
                      {item.destAddress || requestStrings.unknownAddress}
                    </AppText>
                    <AppText variant="caption" tone="secondary">
                      {requestStrings.dropoff}
                    </AppText>
                  </View>
                </View>
              </View>

              <View style={styles.offerBlock}>
                <View style={styles.askCol}>
                  <AppText variant="label" tone="secondary" align="center">
                    {item.proposedFare != null
                      ? requestStrings.passengerAsked
                      : requestStrings.suggested}
                  </AppText>
                  <Money
                    amount={asked}
                    currency={item.currency}
                    decimals={0}
                    variant="banner"
                    tone="primary"
                    align="center"
                  />
                </View>

                <View style={styles.bumpRow}>
                  {BUMPS.map((step) => (
                    <Button
                      key={step}
                      style={styles.bumpButton}
                      size="sm"
                      variant="secondary"
                      label={`+${step}`}
                      disabled={busy || expired}
                      onPress={() => bump(step)}
                    />
                  ))}
                </View>

                <Input
                  label={requestStrings.amountLabel}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  editable={!busy && !expired}
                  placeholder={requestStrings.amountPlaceholder}
                  hint={`${requestStrings.range} ${formatMoney(item.minFare, item.currency, 0)} - ${formatMoney(item.maxFare, item.currency, 0)}`}
                  error={
                    touched && !inRange ? requestStrings.outOfRange : undefined
                  }
                />

                <Button
                  size="md"
                  variant="primary"
                  icon="negotiate"
                  label={pending ? requestStrings.update : requestStrings.send}
                  loading={busy}
                  disabled={busy || expired || !inRange}
                  onPress={() => onBid(item.id, parsed)}
                />

                {pending && myOffer ? (
                  <Button
                    size="md"
                    variant="secondary"
                    icon="close"
                    label={requestStrings.withdraw}
                    disabled={busy}
                    onPress={() => onWithdraw(myOffer.id)}
                  />
                ) : null}

                <AppText variant="caption" tone="secondary" align="center">
                  {expired
                    ? requestStrings.closed
                    : `${requestStrings.closesIn} ${formatClock(remaining)}`}
                </AppText>
              </View>

              <Button
                variant="ghost"
                size="sm"
                label={requestStrings.confirmCancel}
                disabled={busy}
                onPress={onClose}
              />
            </View>
          ) : null}
        </BottomSheet>
      </View>
    </Modal>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    root: { flex: 1, justifyContent: "flex-end" },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: withAlpha("#000000", 0.6),
    },
    body: { gap: spacing.md },

    header: { ...rtlRow, alignItems: "center", gap: spacing.md },
    avatarWrap: { position: "relative" },
    ratingChip: {
      position: "absolute",
      bottom: -4,
      left: -4,
      padding: 2,
      borderRadius: radius.pill,
      backgroundColor: palette.surfaceRaised,
      borderWidth: 1,
      borderColor: palette.surface,
    },
    identity: { flex: 1, gap: 2 },
    metaRow: { ...rtlRow, alignItems: "center", gap: spacing.sm },
    etaCol: { alignItems: "flex-start", gap: 2 },

    divider: { height: 1, backgroundColor: palette.border },

    route: { gap: 0 },
    legRow: { ...rtlRow, alignItems: "flex-start", gap: spacing.md },
    legText: { flex: 1, gap: 2 },
    /** Reference: ml-2.5 w-0.5 h-4 - a stub rail under the icon column. */
    connector: {
      width: 2,
      height: 16,
      marginVertical: 4,
      marginRight: 9,
      backgroundColor: palette.surfaceVariant,
    },

    // Full-bleed to the sheet edges, which is why the horizontal padding the
    // sheet applies is cancelled here.
    offerBlock: {
      marginHorizontal: -layout.containerPadding,
      marginTop: spacing.sm,
      paddingHorizontal: layout.containerPadding,
      paddingVertical: spacing.xl,
      gap: spacing.lg,
      backgroundColor: palette.surfaceRaised,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      borderTopWidth: 1,
      borderTopColor: palette.border,
    },
    askCol: { alignItems: "center", gap: spacing.xs },
    bumpRow: { ...rtlRow, gap: spacing.sm },
    bumpButton: {
      flex: 1,
      borderRadius: radius.lg,
      backgroundColor: palette.background,
      borderColor: palette.surfaceVariant,
      paddingHorizontal: spacing.sm,
    },
  });
