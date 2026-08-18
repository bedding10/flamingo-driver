import React, { useMemo } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { fetchEarnings, type DriverEarningRow } from "../../api/earnings.api";
import {
  AlertBanner,
  AppText,
  Button,
  Card,
  ListRow,
  Money,
  Screen,
  StatTile,
  formatDistanceKm,
  rtlRow,
} from "../../ui";
import { spacing } from "../../theme";
import { tripSummaryStrings as t } from "../../i18n/strings.trip.summary";
import { RIDE_CLASS_LABELS } from "../../i18n/strings.profile.hub";
import type { DriverStackParamList } from "../../navigation/types";

/**
 * Reference: `trip_completed.html`.
 *
 * WHY THIS READS EARNINGS AND NOT THE TRIP
 * `GET /driver/me/trips/:id` exists, but `driver.api.ts` types it as `unknown`,
 * so building on it means casting a shape no one has verified - and the numbers
 * on this screen are money. `GET /driver/me/earnings` is fully typed and
 * already carries all of them (gross, commission, net, destination, distance,
 * ride class, timestamp). It is also the exact query the earnings list caches,
 * so arriving here from that list costs zero extra requests.
 *
 * THE LIMIT, STATED RATHER THAN HIDDEN
 * That response is capped at the last 100 earning rows. A trip older than that
 * has no summary, and this screen says so. It does not fall back to zeros: a
 * zero in a money column reads as "you earned nothing", which would be a lie.
 *
 * NOT YET AUTOMATIC
 * Nothing routes here when a trip completes. `useTripLifecycle` clears
 * `currentTrip` the moment the status turns terminal, so wiring that is a
 * change to the lifecycle, not to this layout, and is deliberately separate.
 */
export function TripCompletedScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<DriverStackParamList>>();
  const route = useRoute<RouteProp<DriverStackParamList, "TripSummary">>();
  const { tripId } = route.params;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["driver", "earnings"],
    queryFn: fetchEarnings,
    staleTime: 60_000,
  });

  const row: DriverEarningRow | null = useMemo(() => {
    const items = data?.items ?? [];
    return items.find((item) => item.tripId === tripId) ?? null;
  }, [data, tripId]);

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

  if (!row) {
    return (
      <Screen scroll bottomInset>
        <AlertBanner
          tone="info"
          title={t.notFoundTitle}
          message={t.notFoundBody}
        />
        <Button
          label={t.back}
          variant="secondary"
          size="md"
          onPress={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  const rideClass = row.trip?.rideClass ?? null;
  const distanceKm = row.trip?.distanceKm ?? null;
  const completedAt = row.trip?.completedAt ?? row.createdAt;

  return (
    <Screen scroll bottomInset>
      {/* Net first and largest: it is the only number the driver keeps. */}
      <Card>
        <AppText variant="caption" tone="secondary">
          {t.netLabel}
        </AppText>
        <Money amount={Number(row.net ?? 0)} variant="banner" />
        <AppText variant="caption" tone="muted">
          {t.netCaption}
        </AppText>
      </Card>

      <View style={styles.tiles}>
        <StatTile
          label={t.grossLabel}
          money={Number(row.gross ?? 0)}
          icon="payments"
          tone="neutral"
        />
        <StatTile
          label={t.commissionLabel}
          money={Number(row.commission ?? 0)}
          icon="receipt"
          tone="neutral"
        />
      </View>

      <Card>
        <AppText variant="subtitle">{t.detailsTitle}</AppText>

        <ListRow
          icon="place"
          title={t.destinationLabel}
          subtitle={row.trip?.destAddress ?? t.unnamedTrip}
        />
        <ListRow
          icon="navigate"
          title={t.distanceLabel}
          value={
            distanceKm != null
              ? formatDistanceKm(Number(distanceKm))
              : t.unknownValue
          }
        />
        <ListRow
          icon="car"
          title={t.classLabel}
          value={
            rideClass
              ? (RIDE_CLASS_LABELS[rideClass] ?? rideClass)
              : t.unknownValue
          }
        />
        <ListRow
          icon="clock"
          title={t.completedAtLabel}
          value={formatDateTime(completedAt)}
        />
      </Card>

      {/* A declared gap, not an empty star row pretending to be one. */}
      <AlertBanner tone="info" message={t.ratingGap} />

      <Button
        label={t.back}
        variant="secondary"
        size="md"
        onPress={() => navigation.goBack()}
      />
    </Screen>
  );
}

/** Local, because it is the only place that needs a full date and a clock. */
function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return t.unknownValue;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return t.unknownValue;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  tiles: { ...rtlRow, gap: spacing.md },
});
