import { MaterialIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Image, StyleSheet, Switch, Text, View } from "react-native";

import { alpha, RADIUS, SPACING, typo } from "../theme/tokens";
import { useTokens, type Tokens } from "../theme/useTokens";

/**
 * Component 7 - Zone / surge card (saved_work_zones reference).
 * Map thumbnail, zone name + district, intensity-tinted multiplier pill,
 * active-requests / est-wait stat row, and the pink Demand Alerts switch.
 *
 * BACKEND NOTE: there is no per-zone alert subscription endpoint, so the
 * switch is presentational unless the caller wires it to something real.
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
  /** Copy, so no English string is baked into the component. */
  activeRequestsLabel?: string;
  estWaitCaption?: string;
  alertsLabel?: string;
};

export function ZoneCard({
  name,
  district,
  multiplier,
  activeRequests,
  estWaitLabel,
  thumbnailUri,
  alertsEnabled,
  onToggleAlerts,
  activeRequestsLabel = "الطلبات النشطة",
  estWaitCaption = "الانتظار التقديري",
  alertsLabel = "تنبيهات الطلب",
}: ZoneCardProps) {
  const t = useTokens();
  const styles = useMemo(() => makeStyles(t), [t]);

  // >= 2x is a hot zone (pink), anything lower is calm (tertiary blue).
  const hot = multiplier >= 2;
  const tone = hot
    ? {
        fg: t.colors.primary,
        bg: alpha(t.colors.primaryContainer, 0.2),
      }
    : {
        fg: t.colors.tertiary,
        bg: alpha(t.colors.tertiaryContainer, 0.2),
      };

  return (
    <View style={[styles.card, t.shadowCard]}>
      {hot ? <View style={styles.accent} /> : null}

      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.name} numberOfLines={2}>
            {name}
          </Text>
          <View style={styles.districtRow}>
            <MaterialIcons
              name="place"
              size={t.iconSize.md}
              color={t.colors.onSurfaceVariant}
            />
            <Text style={styles.district} numberOfLines={1}>
              {district}
            </Text>
          </View>
        </View>

        <View style={[styles.pill, { backgroundColor: tone.bg }]}>
          {hot ? (
            <MaterialIcons name="bolt" size={t.iconSize.md} color={tone.fg} />
          ) : null}
          <Text style={[styles.pillText, { color: tone.fg }]}>
            {multiplier.toFixed(1)}x
          </Text>
        </View>
      </View>

      {thumbnailUri ? (
        <Image
          source={{ uri: thumbnailUri }}
          style={[styles.thumb, !hot && styles.thumbCalm]}
        />
      ) : (
        <View style={[styles.thumb, styles.thumbEmpty]}>
          <MaterialIcons
            name="map"
            size={t.iconSize.xl}
            color={t.colors.outlineVariant}
          />
        </View>
      )}

      <View style={styles.statRow}>
        <View>
          <Text style={styles.statLabel}>{activeRequestsLabel}</Text>
          <Text
            style={[styles.statValue, hot && { color: t.semantic.success }]}
          >
            {activeRequests}
          </Text>
        </View>
        <View style={styles.statRight}>
          <Text style={styles.statLabel}>{estWaitCaption}</Text>
          <Text style={styles.statValueSm}>{estWaitLabel}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerLabel}>{alertsLabel}</Text>
        <Switch
          value={alertsEnabled}
          onValueChange={onToggleAlerts}
          trackColor={{
            false: t.colors.surfaceContainerHighest,
            true: t.colors.primaryContainer,
          }}
          thumbColor={t.colors.surfaceContainerLowest}
          ios_backgroundColor={t.colors.surfaceContainerHighest}
        />
      </View>
    </View>
  );
}

function makeStyles(t: Tokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: t.colors.surfaceContainerHigh,
      borderRadius: RADIUS.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.surfaceBright,
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
      backgroundColor: alpha(t.colors.primaryContainer, 0.2),
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: SPACING.md,
      marginBottom: SPACING.lg,
    },
    headerText: { flex: 1 },
    name: {
      ...typo("titleMd"),
      color: t.colors.onSurface,
      marginBottom: SPACING.xs,
    },
    districtRow: { flexDirection: "row", alignItems: "center", gap: SPACING.xs },
    district: {
      ...typo("labelSm"),
      color: t.colors.onSurfaceVariant,
      flex: 1,
    },
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
      borderColor: alpha(t.colors.outlineVariant, 0.3),
    },
    thumbCalm: { opacity: 0.6 },
    thumbEmpty: {
      backgroundColor: t.colors.surfaceContainerLow,
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
      color: t.colors.onSurfaceVariant,
      marginBottom: SPACING.xs,
    },
    statValue: { ...typo("headlineLgMobile"), color: t.colors.onSurface },
    statValueSm: { ...typo("titleMd"), color: t.colors.onSurface },
    footer: {
      paddingTop: SPACING.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: alpha(t.colors.outlineVariant, 0.5),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    footerLabel: { ...typo("labelMd"), color: t.colors.onSurface },
  });
}
