import React from "react";
import { StyleSheet, View } from "react-native";
import { iconSize, LEVEL_TINTS, spacing, usePalette } from "../theme";
import { Icon } from "../components/Icon";
import { AppText } from "./AppText";
import { rtlRow } from "./rtl";

/**
 * The 5-star row used by the rating, review and trip-completed screens.
 *
 * Stars are the reference gold (#FFD700) - a rating star is a badge, not a
 * button, so it is inside the one exception the design rules allow.
 */
export function StarRating({
  value,
  size = iconSize.sm,
  showValue = false,
  reviews,
}: {
  value: number;
  size?: number;
  showValue?: boolean;
  /** Optional "(128)" style count after the value. */
  reviews?: number;
}) {
  const palette = usePalette();
  const safe = Math.min(5, Math.max(0, Number.isFinite(value) ? value : 0));

  return (
    <View style={styles.row}>
      {[0, 1, 2, 3, 4].map((index) => {
        const filled = safe >= index + 1;
        const half = !filled && safe > index + 0.25;
        return (
          <Icon
            key={index}
            name={filled ? "star" : half ? "starHalf" : "starOutline"}
            size={size}
            color={filled || half ? LEVEL_TINTS.GOLD : palette.textMuted}
          />
        );
      })}
      {showValue ? (
        <AppText variant="caption" tone="secondary">
          {safe.toFixed(2)}
          {reviews === undefined ? "" : ` (${reviews})`}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { ...rtlRow, alignItems: "center", gap: spacing.xs },
});
