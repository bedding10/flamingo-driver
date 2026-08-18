import React, { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import type { FareOpportunity } from "../types/fareOffer";
import { requestStrings } from "../i18n/strings.requests";
import {
  AlertBanner,
  AppText,
  Badge,
  BottomSheet,
  Button,
  ListRow,
  Money,
  SlideAction,
  formatClock,
  formatDistanceKm,
  formatMinutes,
  rtlRow,
} from "../ui";
import { spacing, withAlpha } from "../theme";

/**
 * Confirmation for the only irreversible action on the requests list.
 *
 * A bid is safe: the passenger still has to accept it, and it can be withdrawn.
 * A direct accept is not. It creates the trip server-side, flips availability to
 * ON_TRIP, and cannot be undone from the app - walking away from it counts as a
 * driver cancellation. The card placed that action one tap away from a numeric
 * keyboard, which is how a fat finger books a trip across town.
 *
 * So the tap now only opens this sheet, and the commit is a deliberate drag.
 *
 * The amount shown is the exact amount that will be sent: the driver's edited
 * figure when it was inside the allowed range, otherwise the asked or suggested
 * fare the server will apply. The net payout is never computed here - only the
 * server knows the commission.
 */
export function ConfirmAcceptSheet({
  item,
  amount,
  busy,
  onClose,
  onConfirm,
}: {
  item: FareOpportunity | null;
  amount?: number;
  busy: boolean;
  onClose: () => void;
  onConfirm: (quoteId: string, amount?: number) => void;
}) {
  const quoteId = item?.id ?? null;

  // Ticking `now` rather than storing the countdown: `remaining` is then derived
  // on every render, so the first frame can never show a stale zero and flash
  // the expiry banner over a request that is still open.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!quoteId) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [quoteId]);

  const deadline = item ? new Date(item.expiresAt).getTime() : 0;
  const remaining = deadline - now;
  const expired = deadline > 0 && remaining <= 0;

  const asked = item ? (item.proposedFare ?? item.suggestedFare) : 0;
  const committed = amount ?? asked;
  const amountLabel =
    amount != null
      ? requestStrings.confirmYourAmount
      : item?.proposedFare != null
        ? requestStrings.passengerAsked
        : requestStrings.suggested;

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
              <AppText variant="title">{requestStrings.confirmTitle}</AppText>

              <View style={styles.fare}>
                <Money
                  amount={committed}
                  currency={item.currency}
                  decimals={0}
                  variant="display"
                  tone="primary"
                />
                <AppText variant="caption" tone="secondary">
                  {amountLabel}
                </AppText>
                <AppText variant="caption" tone="secondary">
                  {requestStrings.confirmNetHint}
                </AppText>
              </View>

              <View style={styles.chips}>
                {item.distanceKm != null ? (
                  <Badge
                    icon="place"
                    label={formatDistanceKm(item.distanceKm)}
                  />
                ) : null}
                {item.durationSec != null ? (
                  <Badge
                    icon="clock"
                    label={formatMinutes(item.durationSec / 60)}
                  />
                ) : null}
                {item.commissionPct != null ? (
                  <Badge
                    icon="receipt"
                    tone="warning"
                    label={`${requestStrings.commission} ${item.commissionPct}%`}
                  />
                ) : null}
              </View>

              <View>
                <ListRow
                  icon="place"
                  iconTone="success"
                  subtitle={requestStrings.pickup}
                  title={item.pickupAddress || requestStrings.unknownAddress}
                  showChevron={false}
                />
                <ListRow
                  icon="navigate"
                  iconTone="brand"
                  subtitle={requestStrings.dropoff}
                  title={item.destAddress || requestStrings.unknownAddress}
                  showChevron={false}
                />
              </View>

              <AlertBanner
                tone="warning"
                message={requestStrings.confirmWarning}
              />

              {expired ? (
                <AlertBanner tone="danger" message={requestStrings.closed} />
              ) : (
                <AppText variant="caption" tone="secondary" align="center">
                  {`${requestStrings.closesIn} ${formatClock(remaining)}`}
                </AppText>
              )}

              <SlideAction
                label={requestStrings.confirmSlide}
                tone="primary"
                disabled={busy || expired}
                onConfirm={() => onConfirm(item.id, amount)}
              />

              <Button
                variant="ghost"
                size="md"
                icon="close"
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

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: withAlpha("#000000", 0.6),
  },
  body: { gap: spacing.md },
  fare: { alignItems: "center", gap: spacing.xs },
  chips: { ...rtlRow, gap: spacing.sm, flexWrap: "wrap" },
});
