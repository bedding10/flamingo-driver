import React, { useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, StyleSheet, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { fetchEarnings, type DriverEarningRow } from "../../api/earnings.api";
import {
  AppText,
  Button,
  Card,
  ListRow,
  Money,
  Screen,
  SegmentedTabs,
  StatTile,
  formatDistanceKm,
  rtlRow,
  type SegmentItem,
} from "../../ui";
import { spacing } from "../../theme";
import { earningsStrings as t } from "../../i18n/strings.earnings";

/**
 * Reference: `earnings_analysis.html`.
 *
 * WHAT THE REFERENCE ASKS FOR AND WHAT THE SERVER CAN PROVE
 * The pack draws four tabs (day / week / month / total) over a bar chart.
 * `GET /driver/me/earnings` returns exactly three aggregates - today, week
 * (Monday start) and all - plus at most the last 100 earning rows. There is no
 * month bucket and no per-day series, so this screen ships three tabs and a
 * real row list instead of a chart built from numbers the backend never sent.
 * The missing month is stated on screen rather than hidden.
 *
 * The bucket totals come from the server. The secondary tiles (commission,
 * average) are computed from the rows that are actually on screen and are
 * labelled as such, so a driver can never read a partial sum as a full one.
 */
type Bucket = "today" | "week" | "all";

const BUCKETS: ReadonlyArray<SegmentItem<Bucket>> = [
  { key: "today", label: t.today },
  { key: "week", label: t.week },
  { key: "all", label: t.all },
];

const startOfDay = (): number => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** Monday 00:00, matching the server's week definition. */
const startOfWeek = (): number => {
  const d = new Date();
  const mondayOffset = (d.getDay() + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - mondayOffset);
  return d.getTime();
};

const shortDateTime = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function EarningsScreen() {
  const [bucket, setBucket] = useState<Bucket>("today");

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["driver", "earnings"],
    queryFn: fetchEarnings,
    staleTime: 60_000,
  });

  const rows: DriverEarningRow[] = useMemo(() => {
    const items = data?.items ?? [];
    if (bucket === "all") return items;
    const from = bucket === "today" ? startOfDay() : startOfWeek();
    return items.filter((row) => {
      const at = new Date(row.createdAt).getTime();
      return Number.isFinite(at) && at >= from;
    });
  }, [bucket, data]);

  const totals = data?.totals;
  const headline =
    bucket === "today"
      ? (totals?.today ?? 0)
      : bucket === "week"
        ? (totals?.week ?? 0)
        : (totals?.all ?? 0);

  const commission = useMemo(
    () => rows.reduce((sum, row) => sum + Number(row.commission ?? 0), 0),
    [rows],
  );
  const average = rows.length
    ? rows.reduce((sum, row) => sum + Number(row.net ?? 0), 0) / rows.length
    : 0;

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <View style={styles.center}>
          <AppText tone="secondary" align="center">
            {t.error}
          </AppText>
          <Button
            label={t.retry}
            size="md"
            variant="secondary"
            onPress={() => {
              void refetch();
            }}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      bottomInset
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => {
            void refetch();
          }}
        />
      }
    >
      <SegmentedTabs items={BUCKETS} value={bucket} onChange={setBucket} />

      {/* The headline is the server's own aggregate, never a client sum. */}
      <Card>
        <AppText variant="caption" tone="secondary">
          {t.netLabel}
        </AppText>
        <Money amount={headline} variant="banner" />
        <AppText variant="caption" tone="muted">
          {t.netCaption[bucket]}
        </AppText>
      </Card>

      <View style={styles.tiles}>
        <StatTile
          label={t.tripsLabel}
          value={String(totals?.trips ?? 0)}
          icon="car"
          caption={t.tripsCaption}
        />
        <StatTile
          label={t.averageLabel}
          money={average}
          icon="trending"
          caption={t.fromRecent}
        />
      </View>

      <View style={styles.tiles}>
        <StatTile
          label={t.commissionLabel}
          money={commission}
          icon="receipt"
          caption={t.fromRecent}
        />
        <StatTile
          label={t.listTitle}
          value={String(rows.length)}
          icon="history"
          caption={t.listNote}
        />
      </View>

      <Card>
        <View style={styles.head}>
          <AppText variant="subtitle">{t.listTitle}</AppText>
          <AppText variant="caption" tone="muted">
            {t.listNote}
          </AppText>
        </View>

        {rows.length === 0 ? (
          <AppText tone="secondary">{t.empty}</AppText>
        ) : (
          rows.map((row) => (
            <ListRow
              key={row.id}
              icon="place"
              title={row.trip?.destAddress ?? t.unnamedTrip}
              subtitle={`${shortDateTime(row.createdAt)}${
                row.trip?.distanceKm
                  ? ` · ${formatDistanceKm(Number(row.trip.distanceKm))}`
                  : ""
              }`}
              trailing={<Money amount={Number(row.net ?? 0)} variant="subtitle" />}
            />
          ))
        )}
      </Card>

      <AppText variant="caption" tone="muted">
        {t.noMonthNote}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.lg },
  tiles: { ...rtlRow, gap: spacing.md },
  head: { gap: spacing.xs },
});
