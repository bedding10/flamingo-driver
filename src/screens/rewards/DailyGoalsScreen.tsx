import React, { useMemo } from "react";
import { ActivityIndicator, RefreshControl, StyleSheet, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { fetchEarnings } from "../../api/earnings.api";
import {
  AppText,
  Badge,
  Button,
  Card,
  Money,
  Screen,
  StatTile,
  rtlRow,
} from "../../ui";
import { spacing } from "../../theme";
import { loadRewardsFeature } from "../../features/rewards";
import { rewardsStrings as t } from "../../i18n/strings.rewards";

/**
 * Reference: `daily_goals_progress.html`.
 *
 * The reference shows a target ring ("7 of 10 trips"), a streak and a reward.
 * The server has no goals API, so this screen splits itself honestly:
 *
 *  - the top half is REAL: today's net and today's trip count, both derived
 *    from GET /driver/me/earnings;
 *  - the bottom half is the DECLARED GAP: it states that targets, streaks and
 *    rewards have no endpoint yet, and shows no invented progress bar.
 *
 * Today's trip count is counted from the returned rows rather than taken from
 * `totals.trips`, because that total is the driver's lifetime `Driver.totalTrips`
 * and using it here would show a career figure as a daily one.
 */
export function DailyGoalsScreen() {
  const gap = loadRewardsFeature("dailyGoals");

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["driver", "earnings"],
    queryFn: fetchEarnings,
    staleTime: 60_000,
  });

  const todayTrips = useMemo(() => {
    const items = data?.items ?? [];
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    const from = midnight.getTime();
    return items.filter((row) => new Date(row.createdAt).getTime() >= from)
      .length;
  }, [data]);

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
      <View style={styles.head}>
        <AppText variant="headline">{t.goalsTitle}</AppText>
        <AppText variant="caption" tone="secondary">
          {t.goalsSubtitle}
        </AppText>
      </View>

      <Card>
        <AppText variant="caption" tone="secondary">
          {t.todayNet}
        </AppText>
        <Money amount={data?.totals.today ?? 0} variant="banner" />
        <AppText variant="caption" tone="muted">
          {t.fromServer}
        </AppText>
      </Card>

      <View style={styles.tiles}>
        <StatTile
          label={t.todayTrips}
          value={String(todayTrips)}
          icon="car"
          caption={t.fromRecentRows}
        />
        <StatTile
          label={t.weekNet}
          money={data?.totals.week ?? 0}
          icon="trending"
          caption={t.fromServer}
        />
      </View>

      {/* The declared gap. It is a statement, not a placeholder widget. */}
      {gap.available ? null : (
        <Card tone="sunken">
          <View style={styles.gapHead}>
            <AppText variant="subtitle">{t.gapTitle}</AppText>
            <Badge label={t.gapBadge} tone="warning" icon="info" />
          </View>
          <AppText tone="secondary">{t.gapBody}</AppText>
          <AppText variant="caption" tone="muted">
            {gap.reason}
          </AppText>
          <AppText variant="caption" tone="muted">
            {t.gapHint}
          </AppText>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  head: { gap: spacing.xs },
  tiles: { ...rtlRow, gap: spacing.md },
  gapHead: { ...rtlRow, alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
});
