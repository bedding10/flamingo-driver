import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { radius, spacing, typography, usePalette, withAlpha } from "../theme";

export type PillTone =
  | "pending"
  | "approved"
  | "rejected"
  | "expired"
  | "neutral"
  | "brand"
  | "busy";

/**
 * Compact status chip: documents, account state, socket link, availability.
 *
 * Colour is never the only carrier of meaning - the label is always spelled
 * out - because a driver may be colour-blind and the screen is often read in
 * direct sunlight.
 *
 * PHASE 7.5: theme-aware (it is used on the dark map overlay and on light menu
 * surfaces), an optional leading dot for connection-style states, and two new
 * tones: `brand` (pink, for an active brand state) and `busy` (on a trip).
 * The `expired` tone stays red like `rejected` because both mean the same thing
 * to a driver on the road: you cannot work with this. The label separates them.
 */
export function StatusPill({
  label,
  tone,
  dot = false,
}: {
  label: string;
  tone: PillTone;
  dot?: boolean;
}) {
  const palette = usePalette();

  const color =
    tone === "pending"
      ? palette.warning
      : tone === "approved"
        ? palette.online
        : tone === "rejected" || tone === "expired"
          ? palette.danger
          : tone === "brand"
            ? palette.primaryText
            : tone === "busy"
              ? palette.busy
              : palette.offline;

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: withAlpha(hexOf(color), 0.14),
          borderColor: withAlpha(hexOf(color), 0.45),
        },
      ]}
    >
      {dot ? <View style={[styles.dot, { backgroundColor: color }]} /> : null}
      <Text style={[styles.label, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/**
 * Every palette colour used above is a #RRGGBB literal, but this keeps
 * withAlpha() safe if a future palette entry ever arrives as rgba(): in that
 * case the flat colour is used with no transparency instead of throwing.
 */
function hexOf(color: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#6B7078";
}

const styles = StyleSheet.create({
  pill: {
    /**
     * PHASE 1: was "row-reverse". That only looked right because RTL had never
     * actually been enabled - it was hand-mirroring an LTR layout. React Native
     * mirrors plain "row" automatically once I18nManager.isRTL is set, so
     * "row-reverse" would now flip the dot back to the wrong side in Arabic and
     * put it on the wrong side in French and English.
     */
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  /** The label inherits the app's writing direction; it must not force one. */
  label: { ...typography.caption, fontWeight: "600" },
});
