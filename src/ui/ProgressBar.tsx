import React, { useMemo } from "react";
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { radius, usePalette, withAlpha, type Palette } from "../theme";

export type ProgressTone = "brand" | "success" | "warning" | "danger";

/**
 * The bar used by daily goals, document checklists, rating breakdowns and the
 * prize pool. Value is a 0..1 ratio and is clamped, because a goal at 120%
 * must render full, not overflow its track.
 */
export function ProgressBar({
  value,
  tone = "brand",
  height = 8,
  style,
}: {
  value: number;
  tone?: ProgressTone;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const ratio = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

  const fillColor =
    tone === "success"
      ? palette.online
      : tone === "warning"
        ? palette.warning
        : tone === "danger"
          ? palette.danger
          : palette.primary;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(ratio * 100) }}
      style={[styles.track, { height, borderRadius: height / 2 }, style]}
    >
      <View
        style={{
          width: `${ratio * 100}%`,
          height: "100%",
          borderRadius: height / 2,
          backgroundColor: fillColor,
        }}
      />
    </View>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    track: {
      width: "100%",
      backgroundColor: withAlpha(palette.textPrimary, 0.12),
      borderRadius: radius.pill,
      overflow: "hidden",
    },
  });
