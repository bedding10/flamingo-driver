import React, { useEffect } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { FareOpportunityCard } from "../../components/FareOpportunityCard";
import { useFareOpportunities } from "../../hooks/useFareOpportunities";
import { textAlignStart } from "../../i18n";
import { requestStrings } from "../../i18n/strings.requests";
import type { DriverStackParamList } from "../../navigation/types";
import {
  alpha,
  COLORS,
  RADIUS,
  SEMANTIC,
  SPACING,
  typo,
} from "../../theme/tokens";
import { PillButton } from "../../ui";

/**
 * The requests page: open FareQuotes the driver may negotiate on.
 *
 * This does NOT replace the push offer card on Home. A `ride:offer` is an
 * assignment that must be answered within seconds and therefore stays a
 * full-width sheet over the map; a negotiable request has a longer window and
 * belongs in a list the driver can read at a red light.
 *
 * Migrated to src/theme/tokens: surfaces, type scale and spacing now come from
 * the single source of truth instead of the legacy palette.
 */
export function RequestsScreen() {
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
    acceptedTripId,
    refresh,
    bid,
    withdraw,
    directAccept,
  } = useFareOpportunities();

  // A won request means there is a running trip; the trip lives on Home, so
  // staying on a list the driver can no longer act on would be a trap.
  useEffect(() => {
    if (acceptedTripId) navigation.navigate("Home");
  }, [acceptedTripId, navigation]);

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
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.subtitle}>{requestStrings.subtitle}</Text>
            {notice ? <Text style={styles.notice}>{notice}</Text> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {blocked
                ? requestStrings.offlineTitle
                : loading
                  ? requestStrings.refresh
                  : requestStrings.empty}
            </Text>
            <Text style={styles.emptyHint}>
              {blocked
                ? (blockedReason ?? requestStrings.offlineHint)
                : requestStrings.emptyHint}
            </Text>
            {blocked ? (
              <View style={styles.emptyAction}>
                <PillButton
                  label={requestStrings.offlineTitle}
                  variant="secondary"
                  onPress={() => navigation.navigate("Home")}
                />
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <FareOpportunityCard
            item={item}
            busy={busyId === item.id || busyId === item.myOffer?.id}
            onBid={bid}
            onWithdraw={withdraw}
            onAccept={directAccept}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.lg, gap: SPACING.lg, flexGrow: 1 },
  header: { gap: SPACING.xs, paddingBottom: SPACING.xs },
  subtitle: {
    ...typo("labelSm"),
    color: COLORS.onSurfaceVariant,
    textAlign: textAlignStart(),
  },
  notice: {
    ...typo("labelSm"),
    color: SEMANTIC.success,
    textAlign: textAlignStart(),
  },
  error: {
    ...typo("labelSm"),
    color: COLORS.error,
    textAlign: textAlignStart(),
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.container,
  },
  // Centre does not mirror, so both of these are correct in any direction.
  emptyTitle: {
    ...typo("titleMd"),
    color: COLORS.onSurface,
    textAlign: "center",
  },
  emptyHint: {
    ...typo("bodyMd"),
    color: COLORS.onSurfaceVariant,
    textAlign: "center",
  },
  emptyAction: {
    marginTop: SPACING.md,
    alignSelf: "stretch",
    backgroundColor: alpha(COLORS.surfaceContainer, 0),
    borderRadius: RADIUS.full,
  },
});
