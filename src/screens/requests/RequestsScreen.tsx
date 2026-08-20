import React, { useEffect, useMemo } from "react";
import {
  FlatList,
  Pressable,
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
  radius,
  spacing,
  typography,
  usePalette,
  type Palette,
} from "../../theme";

/**
 * The requests page: open FareQuotes the driver may bid on.
 *
 * This does NOT replace the push offer card on Home. A `ride:offer` is an
 * assignment that must be answered within seconds and therefore stays a
 * full-width sheet over the map; a bidding request has a 2 minute window and
 * belongs in a list the driver can read at a red light.
 *
 * PHASE 1 (R-11): no rows to fix here - this screen is a single column - but
 * four text styles were pinned `textAlign: "right"` / `writingDirection: "rtl"`
 * and now resolve their own alignment. `emptyHint` keeps centre.
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
    acceptedTripId,
    refresh,
    bid,
    withdraw,
  } = useFareOpportunities();

  // A won bid means there is a running trip; the trip lives on Home, so staying
  // on a list of requests the driver can no longer take would be a trap.
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
            tintColor={palette.primary}
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
              <Pressable
                accessibilityRole="button"
                onPress={() => navigation.navigate("Home")}
                style={styles.emptyAction}
              >
                <Text style={styles.emptyActionLabel}>
                  {requestStrings.offlineTitle}
                </Text>
              </Pressable>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <FareOpportunityCard
            item={item}
            busy={busyId === item.id || busyId === item.myOffer?.id}
            onBid={bid}
            onWithdraw={withdraw}
          />
        )}
      />
    </View>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: palette.background },
    list: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
    header: { gap: spacing.xs },
    subtitle: {
      ...typography.caption,
      color: palette.textSecondary,
      textAlign: textAlignStart(),
    },
    notice: {
      ...typography.caption,
      color: palette.info,
      textAlign: textAlignStart(),
    },
    error: {
      ...typography.caption,
      color: palette.danger,
      textAlign: textAlignStart(),
    },
    empty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      paddingVertical: spacing.xl,
    },
    // Centre does not mirror, so both of these are correct in any direction.
    emptyTitle: {
      ...typography.subtitle,
      color: palette.textPrimary,
      textAlign: "center",
    },
    emptyHint: {
      ...typography.caption,
      color: palette.textSecondary,
      textAlign: "center",
    },
    emptyAction: {
      marginTop: spacing.md,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.surfaceSunken,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
    },
    emptyActionLabel: {
      ...typography.subtitle,
      color: palette.primaryText,
    },
  });
