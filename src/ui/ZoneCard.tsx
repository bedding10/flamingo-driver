import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Switch, Text, View } from "react-native";

import {
  alpha,
  COLORS,
  ICON_SIZE,
  RADIUS,
  SEMANTIC,
  SHADOW_CARD,
  SPACING,
  typo,
} from "../theme/tokens";

/**
 * Component 7 - Zone / surge card (saved_work_zones reference).
 * Map thumbnail, zone name + district, intensity-tinted multiplier pill,
 * active-requests / est-wait stat row, and the pink Demand Alerts switch.
 */
export type ZoneCardProps = {
  name: string;
  district: string;
  /** Surge multiplier, e.g. 2.5 renders as "2.5x". */
  multiplier: number;
  activeRequests: number;
  estWaitLabel: string;
  thumbnailUri?: string | null;
  alertsEnabled: boolean;
  onToggleAlerts?: (next: boolean) => void;
};

/** >= 2x is a hot zone (pink), anything lower is calm (tertiary blue). */
function intensity(multiplier: number) {
  return multiplier >= 2
    ? { fg: COLORS.primary, bg: alpha(COLORS.primaryContainer, 0.2), hot: true }
    : { fg: COLORS.tertiary, bg: alpha(COLORS.tertiaryContainer, 0.2), hot: false };
}

export function ZoneCard({
  name,
  district,
  multiplier,
  activeRequests,
  estWaitLabel,
  thumbnailUri,
  alertsEnabled,
  onToggleAlerts,
}: ZoneCardProps) {
  const tone = intensity(multiplier);

  return (
    <View style={[styles.card, SHADOW_CARD]}>
      {tone.hot ? <View style={styles.accent} /> : null}

      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.name} numberOfLines={2}>
            {name}
          </Text>
          <View style={styles.districtRow}>
            <MaterialIcons
              name="place"
              size={ICON_SIZE.md}
              color={COLORS.onSurfaceVariant}
            />
            <Text style={styles.district} numberOfLines={1}>
              {district}
            </Text>
          </View>
        </View>

        <View style={[styles.pill, { backgroundColor: tone.bg }]}>
          {tone.hot ? (
            <MaterialIcons name="bolt" size={ICON_SIZE.md} color={tone.fg} />
          ) : null}
          <Text style={[styles.pillText, { color: tone.fg }]}>
            {multiplier.toFixed(1)}x
          </Text>
        </View>
      </View>

      {thumbnailUri ? (
        <Image
          source={{ uri: thumbnailUri }}
          style={[styles.thumb, !tone.hot && styles.thumbCalm]}
        />
      ) : (
        <View style={[styles.thumb, styles.thumbEmpty]}>
          <MaterialIcons
            name="map"
            size={ICON_SIZE.xl}
            color={COLORS.outlineVariant}
          />
        </View>
      )}

      <View style={styles.statRow}>
        <View>
          <Text style={styles.statLabel}>Active Requests</Text>
          <Text
            style={[
              styles.statValue,
              tone.hot && { color: SEMANTIC.success },
            ]}
          >
            {activeRequests}
          </Text>
        </View>
        <View style={styles.statRight}>
          <Text style={styles.statLabel}>Est. Wait</Text>
          <Text style={styles.statValueSm}>{estWaitLabel}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerLabel}>Demand Alerts</Text>
        <Switch
          value={alertsEnabled}
          onValueChange={onToggleAlerts}
          trackColor={{
            false: COLORS.surfaceContainerHighest,
            true: COLORS.primaryContainer,
          }}
          thumbColor={COLORS.onBackground}
          ios_backgroundColor={COLORS.surfaceContainerHighest}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: RADIUS.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.surfaceBright,
    padding: SPACING.xl,
    overflow: "hidden",
  },
  accent: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 128,
    height: 128,
    borderRadius: RADIUS.full,
    backgroundColor: alpha(COLORS.primaryContainer, 0.2),
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  headerText: { flex: 1 },
  name: { ...typo("titleMd"), color: COLORS.onSurface, marginBottom: SPACING.xs },
  districtRow: { flexDirection: "row", alignItems: "center", gap: SPACING.xs },
  district: { ...typo("labelSm"), color: COLORS.onSurfaceVariant, flex: 1 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  pillText: { ...typo("labelMd") },
  thumb: {
    width: "100%",
    height: 128,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: alpha(COLORS.outlineVariant, 0.3),
  },
  thumbCalm: { opacity: 0.6 },
  thumbEmpty: {
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.xl,
  },
  statRight: { alignItems: "flex-end" },
  statLabel: {
    ...typo("labelSm"),
    color: COLORS.onSurfaceVariant,
    marginBottom: SPACING.xs,
  },
  statValue: { ...typo("headlineLgMobile"), color: COLORS.onSurface },
  statValueSm: { ...typo("titleMd"), color: COLORS.onSurface },
  footer: {
    paddingTop: SPACING.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: alpha(COLORS.outlineVariant, 0.5),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerLabel: { ...typo("labelMd"), color: COLORS.onSurface },
});
