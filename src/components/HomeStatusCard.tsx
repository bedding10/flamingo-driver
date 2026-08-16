import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { OnlineToggle } from "./OnlineToggle";
import {
  radius,
  shadows,
  spacing,
  typography,
  usePalette,
} from "../theme";
import type { DriverAvailability } from "../types/driver";

/**
 * PHASE 7.5 - the compact home status card.
 *
 * What it replaces: a full-width bottom sheet that stacked the status line, the
 * vehicle line, a hint paragraph and a 72pt-tall button, and swallowed roughly a
 * third of the map on a small phone. On a map-first screen that is the wrong
 * trade: the driver needs to see where they are, not read a paragraph.
 *
 * Now it is one floating rounded card, inset from the edges like the navigation,
 * with a single row: state on the right, action on the left. The vehicle line is
 * secondary and truncated, the hint is one line and only shown when it actually
 * adds something (offline, or on a trip), and warnings (permissions, approval,
 * errors) are still surfaced - a redesign must never hide the reason the driver
 * is not receiving requests.
 */
export function HomeStatusCard({
  availability,
  statusLabel,
  statusColor,
  vehicleLine,
  hint,
  warning,
  error,
  pending,
  blocked,
  labels,
  bottom,
  onToggle,
  onWarningPress,
}: {
  availability: DriverAvailability;
  statusLabel: string;
  statusColor: string;
  vehicleLine: string;
  hint?: string | null;
  warning?: string | null;
  error?: string | null;
  pending: boolean;
  blocked: boolean;
  labels: { goOnline: string; goOffline: string; onTrip: string };
  /** Distance from the bottom of the screen, already clear of the nav bar. */
  bottom: number;
  onToggle: () => void;
  onWarningPress?: () => void;
}) {
  const palette = usePalette();

  return (
    <View
      style={[
        styles.card,
        {
          bottom,
          backgroundColor: palette.surface,
          borderColor: palette.border,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.textCol}>
          <View style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: statusColor }]} />
            <Text
              style={[styles.status, { color: palette.textPrimary }]}
              numberOfLines={1}
            >
              {statusLabel}
            </Text>
          </View>
          <Text
            style={[styles.vehicle, { color: palette.textSecondary }]}
            numberOfLines={1}
          >
            {vehicleLine}
          </Text>
        </View>

        <OnlineToggle
          compact
          availability={availability}
          pending={pending}
          blocked={blocked}
          labels={labels}
          onToggle={onToggle}
        />
      </View>

      {hint ? (
        <Text
          style={[styles.hint, { color: palette.textMuted }]}
          numberOfLines={1}
        >
          {hint}
        </Text>
      ) : null}

      {warning ? (
        <Pressable
          accessibilityRole={onWarningPress ? "button" : undefined}
          onPress={onWarningPress}
          style={[
            styles.warning,
            {
              backgroundColor: palette.surfaceSunken,
              borderColor: palette.warning,
            },
          ]}
        >
          <Text
            style={[styles.warningText, { color: palette.warning }]}
            numberOfLines={2}
          >
            {warning}
          </Text>
        </Pressable>
      ) : null}

      {error ? (
        <Text
          style={[styles.warningText, { color: palette.danger }]}
          numberOfLines={2}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    left: 14,
    right: 14,
    borderRadius: radius.sheet,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    ...shadows.floating,
  },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  textCol: { flex: 1, gap: 2 },
  statusRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.sm,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  status: {
    ...typography.subtitle,
    textAlign: "right",
    writingDirection: "rtl",
    flexShrink: 1,
  },
  vehicle: {
    ...typography.caption,
    textAlign: "right",
    writingDirection: "rtl",
  },
  hint: {
    ...typography.caption,
    textAlign: "right",
    writingDirection: "rtl",
  },
  warning: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  warningText: {
    ...typography.caption,
    textAlign: "right",
    writingDirection: "rtl",
  },
});
