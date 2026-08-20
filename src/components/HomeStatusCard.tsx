import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { OnlineToggle } from "./OnlineToggle";
import {
  layout,
  radius,
  shadows,
  spacing,
  typography,
  usePalette,
} from "../theme";
import { textAlignStart } from "../i18n";
import type { DriverAvailability } from "../types/driver";

/**
 * The compact home status card.
 *
 * It is one floating rounded card, inset from the edges like the navigation,
 * with a single row: the state leads, the action trails. The vehicle line is
 * secondary and truncated, the hint is one line and only shown when it actually
 * adds something (offline, or on a trip), and warnings (permissions, approval,
 * errors) are still surfaced - a redesign must never hide the reason the driver
 * is not receiving requests.
 *
 * PHASE 1 (Stitch): it now uses the reference's floating-chrome recipe -
 * `bg-surface-container/85` with a `surface-variant` border and the 12px
 * bottom-sheet margin from the config. React Native has no backdrop blur on
 * Android, so `palette.overlay` is the same surface at a higher alpha rather
 * than a fake blur.
 *
 * PHASE 1 (R-11): the two rows were `row-reverse` and the four text styles were
 * `textAlign: "right"` with `writingDirection: "rtl"`. That was an Arabic-only
 * layout hand-mirrored before real RTL existed. Now that forceRTL is on, React
 * Native mirrors `"row"` itself, so the hand-mirroring cancelled it out and put
 * the card back into latin order in Arabic. Rows are plain "row"; the text uses
 * textAlignStart().
 *
 * Why textAlignStart() is safe in a module-level StyleSheet: this file imports
 * "../i18n", and an imported module's body is evaluated before the body of the
 * module importing it. `syncDirectionAtBoot()` therefore runs before this
 * stylesheet is built, so the direction is already settled. The direction also
 * cannot change without a bundle reload, so there is nothing to react to.
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
          backgroundColor: palette.overlay,
          borderColor: palette.surfaceVariant,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.textCol}>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.dot,
                { backgroundColor: statusColor, shadowColor: statusColor },
              ]}
            />
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
    left: layout.sheetMargin,
    right: layout.sheetMargin,
    borderRadius: radius.sheet,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    ...shadows.floating,
  },
  // Plain "row": React Native mirrors it under RTL. See the R-11 note above.
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  textCol: { flex: 1, gap: 2 },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  // The Stitch presence dot: 8px with its own glow.
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  status: {
    ...typography.subtitle,
    textAlign: textAlignStart(),
    flexShrink: 1,
  },
  vehicle: {
    ...typography.caption,
    textAlign: textAlignStart(),
  },
  hint: {
    ...typography.caption,
    textAlign: textAlignStart(),
  },
  warning: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  warningText: {
    ...typography.caption,
    textAlign: textAlignStart(),
  },
});
