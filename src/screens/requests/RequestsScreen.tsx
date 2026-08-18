import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ConfirmAcceptSheet } from "../../components/ConfirmAcceptSheet";
import { FareOpportunityCard } from "../../components/FareOpportunityCard";
import {
  ReportRequestSheet,
  type ReportTarget,
} from "../../components/ReportRequestSheet";
import type { ComplaintReason } from "../../api/complaints.api";
import { useFareOpportunities } from "../../hooks/useFareOpportunities";
import { requestStrings } from "../../i18n/strings.requests";
import type { DriverStackParamList } from "../../navigation/types";
import type { FareOpportunity } from "../../types/fareOffer";
import { AlertBanner, AppText } from "../../ui";
import { spacing, usePalette, type Palette } from "../../theme";

/**
 * The requests page: open FareQuotes the driver may bid on.
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

  // Read the live row out of the polled list rather than snapshotting it, so the
  // sheet shows the current fare and countdown instead of a 15-second-old copy.
  const confirmItem = useMemo(
    () =>
      pendingAccept
        ? (items.find((row) => row.id === pendingAccept.quoteId) ?? null)
        : null,
    [items, pendingAccept],
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
          <View style={styles.header}>
            <AppText variant="caption" tone="secondary">
              {requestStrings.subtitle}
            </AppText>

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
            onBid={bid}
            onWithdraw={withdraw}
            onDirectAccept={askDirectAccept}
            onHide={hide}
            onReport={openReport}
          />
        )}
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
    list: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
    header: { gap: spacing.md },
    empty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      paddingVertical: spacing.xl,
    },
  });
