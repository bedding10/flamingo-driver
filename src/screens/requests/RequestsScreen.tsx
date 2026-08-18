import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ConfirmAcceptSheet } from "../../components/ConfirmAcceptSheet";
import { FareOpportunityCard } from "../../components/FareOpportunityCard";
import { NegotiateSheet } from "../../components/NegotiateSheet";
import {
  ReportRequestSheet,
  type ReportTarget,
} from "../../components/ReportRequestSheet";
import type { ComplaintReason } from "../../api/complaints.api";
import { useFareOpportunities } from "../../hooks/useFareOpportunities";
import { requestStrings } from "../../i18n/strings.requests";
import type { DriverStackParamList } from "../../navigation/types";
import type { FareOpportunity } from "../../types/fareOffer";
import { AlertBanner, AppText, rtlRow } from "../../ui";
import { layout, spacing, usePalette, type Palette } from "../../theme";

/**
 * The requests page: open FareQuotes the driver may bid on.
 *
 * THE REFERENCE HEADER, `available_requests.html`:
 *
 *   header px-container-padding py-6 sticky top-0 bg-surface/80 backdrop-blur-md
 *     h1   font-headline-lg-mobile text-on-surface        -> "Ride Requests"
 *     span text-primary-container text-body-lg ml-2        -> "(3)"
 *
 * The count is the point of that header: it is the only place in the pack that
 * tells the driver how many requests are on the table, and it is pink because it
 * is the number that changes.
 *
 * Three notes on the translation:
 *  - it is a real sibling above the list rather than a `sticky` element. The
 *    visual result is the same - the title never scrolls away - and it keeps the
 *    banners below it scrolling normally instead of being pinned to the top with
 *    it, which is what FlatList's sticky header would have done.
 *  - no blur: `backdrop-blur-md` needs expo-blur, which this project does not
 *    depend on. Nothing scrolls under the header here, so nothing is lost.
 *  - the count is body-md, not body-lg. The type ramp exposes the eight Stitch
 *    tokens under the app's own names and has no body-lg alias, and inventing a
 *    one-off 18px style for a single parenthesis is exactly the drift this pass
 *    is undoing.
 *
 * The old "bid on a request to get a trip" subtitle is gone: the reference has
 * no subtitle here, and the title plus the count already say it.
 */
export function RequestsScreen() {
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const navigation =
    useNavigation<NativeStackNavigationProp<DriverStackParamList>>();
  const {
    items,
    loading,
    refreshing,
    blocked,
    blockedReason,
    error,
    busyId,
    notice,
    dismissNotice,
    acceptedTripId,
    refresh,
    bid,
    withdraw,
    directAccept,
    hide,
    report,
  } = useFareOpportunities();

  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);

  /**
   * Direct accept is the one action here that cannot be undone, so the card's
   * tap only records an intent; nothing is sent until the sheet is dragged.
   */
  const [pendingAccept, setPendingAccept] = useState<{
    quoteId: string;
    amount?: number;
  } | null>(null);
  const [vanished, setVanished] = useState(false);

  /**
   * Bidding moved off the card and into NegotiateSheet, so the card matches the
   * reference's two-button footer. Only the id is held here - the sheet reads
   * the live row, same as the confirmation does.
   */
  const [negotiateId, setNegotiateId] = useState<string | null>(null);

  // Read the live row out of the polled list rather than snapshotting it, so the
  // sheet shows the current fare and countdown instead of a 15-second-old copy.
  const confirmItem = useMemo(
    () =>
      pendingAccept
        ? (items.find((row) => row.id === pendingAccept.quoteId) ?? null)
        : null,
    [items, pendingAccept],
  );

  const negotiateItem = useMemo(
    () =>
      negotiateId
        ? (items.find((row) => row.id === negotiateId) ?? null)
        : null,
    [items, negotiateId],
  );

  // If the request is claimed by someone else or expires while the driver is
  // still reading the sheet, close it and say why: a sheet that disappears on
  // its own reads as a bug, and silence here would look like a lost trip.
  useEffect(() => {
    if (pendingAccept && !confirmItem) {
      setPendingAccept(null);
      setVanished(true);
    }
  }, [confirmItem, pendingAccept]);

  useEffect(() => {
    if (negotiateId && !negotiateItem) {
      setNegotiateId(null);
      setVanished(true);
    }
  }, [negotiateId, negotiateItem]);

  useEffect(() => {
    if (acceptedTripId) navigation.navigate("Home");
  }, [acceptedTripId, navigation]);

  const askDirectAccept = useCallback((quoteId: string, amount?: number) => {
    setVanished(false);
    setPendingAccept({ quoteId, amount });
  }, []);

  const confirmDirectAccept = useCallback(
    (quoteId: string, amount?: number) => {
      setPendingAccept(null);
      directAccept(quoteId, amount);
    },
    [directAccept],
  );

  const openNegotiate = useCallback((item: FareOpportunity) => {
    setVanished(false);
    setNegotiateId(item.id);
  }, []);

  /**
   * A bid closes the sheet immediately. The request stays on the list with the
   * driver's amount on it, and any failure arrives in the banners above the
   * list, so keeping a spinner in a modal over the top of that would only hide
   * the answer.
   */
  const submitBid = useCallback(
    (quoteId: string, amount: number) => {
      setNegotiateId(null);
      bid(quoteId, amount);
    },
    [bid],
  );

  const openReport = useCallback((item: FareOpportunity) => {
    const againstUserId = item.passenger?.id;
    if (!againstUserId) return;
    setReportTarget({
      fareQuoteId: item.id,
      againstUserId,
      passengerName: item.passenger?.name ?? null,
    });
  }, []);

  const submitReport = useCallback(
    (input: {
      fareQuoteId: string;
      againstUserId: string;
      reason: ComplaintReason;
      message?: string;
    }) => {
      report(input);
      setReportTarget(null);
    },
    [report],
  );

  return (
    <View style={styles.root}>
      <View style={styles.titleBar}>
        <AppText variant="headline">{requestStrings.title}</AppText>
        <AppText style={styles.count}>{`(${items.length})`}</AppText>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={palette.primary}
          />
        }
        ListHeaderComponent={
          notice || vanished || error || blocked ? (
            <View style={styles.header}>
              {notice ? (
                <AlertBanner
                  tone="info"
                  message={notice}
                  actionLabel={requestStrings.dismiss}
                  onAction={dismissNotice}
                />
              ) : null}

              {vanished ? (
                <AlertBanner
                  tone="warning"
                  message={requestStrings.confirmGone}
                  actionLabel={requestStrings.dismiss}
                  onAction={() => setVanished(false)}
                />
              ) : null}

              {error ? <AlertBanner tone="danger" message={error} /> : null}

              {blocked ? (
                <AlertBanner
                  tone="warning"
                  title={requestStrings.offlineTitle}
                  message={blockedReason ?? requestStrings.offlineHint}
                  actionLabel={requestStrings.goHome}
                  onAction={() => navigation.navigate("Home")}
                />
              ) : null}
            </View>
          ) : null
        }
        ListEmptyComponent={
          blocked ? null : (
            <View style={styles.empty}>
              <AppText variant="subtitle">
                {loading ? requestStrings.refresh : requestStrings.empty}
              </AppText>
              <AppText variant="caption" tone="secondary">
                {requestStrings.emptyHint}
              </AppText>
            </View>
          )
        }
        renderItem={({ item }) => (
          <FareOpportunityCard
            item={item}
            busy={busyId === item.id || busyId === item.myOffer?.id}
            onNegotiate={openNegotiate}
            onDirectAccept={askDirectAccept}
            onHide={hide}
            onReport={openReport}
          />
        )}
      />

      <NegotiateSheet
        item={negotiateItem}
        busy={
          busyId === negotiateItem?.id ||
          busyId === negotiateItem?.myOffer?.id
        }
        onClose={() => setNegotiateId(null)}
        onBid={submitBid}
        onWithdraw={withdraw}
      />

      <ConfirmAcceptSheet
        item={confirmItem}
        amount={pendingAccept?.amount}
        busy={busyId === confirmItem?.id}
        onClose={() => setPendingAccept(null)}
        onConfirm={confirmDirectAccept}
      />

      <ReportRequestSheet
        target={reportTarget}
        busy={busyId === reportTarget?.fareQuoteId}
        onClose={() => setReportTarget(null)}
        onSubmit={submitReport}
      />
    </View>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: palette.background },
    titleBar: {
      ...rtlRow,
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal: layout.containerPadding,
      paddingVertical: spacing["2xl"],
      backgroundColor: palette.background,
    },
    /** Reference: text-primary-container - the fill pink, not the accent tint. */
    count: { color: palette.primary },
    list: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
    header: { gap: spacing.md, marginBottom: spacing.md },
    empty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      paddingVertical: spacing.xl,
    },
  });
