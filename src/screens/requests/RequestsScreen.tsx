import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
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
 *
 * This does NOT replace the push offer card on Home. A `ride:offer` is an
 * assignment that must be answered within seconds and therefore stays a
 * full-width sheet over the map; a bidding request has a longer window and
 * belongs in a list the driver can read at a red light.
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

  // A won bid means there is a running trip; the trip lives on Home, so staying
  // on a list of requests the driver can no longer take would be a trap.
  useEffect(() => {
    if (acceptedTripId) navigation.navigate("Home");
  }, [acceptedTripId, navigation]);

  const openReport = useCallback((item: FareOpportunity) => {
    const againstUserId = item.passenger?.id;
    // Second guard: the card already hides the action when the quote carries no
    // passenger id, because the complaint endpoint cannot attribute it.
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
            onDirectAccept={directAccept}
            onHide={hide}
            onReport={openReport}
          />
        )}
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
