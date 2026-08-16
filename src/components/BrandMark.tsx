import React from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius, spacing, typography, withAlpha } from "../theme";

/**
 * PHASE 7 - the flaminGO wordmark, drawn from type instead of an image.
 *
 * The brand is written "flaminGO" with the last two letters in gold, and the
 * flamingo glyph stands in for the logo. It is built in code on purpose: there
 * is no logo asset tracked in this repository, and inventing one as a remote R2
 * fetch would put the brand behind a network request on the first frame of the
 * map. When a real vector asset exists, only this file changes.
 */
export function BrandMark({
  compact = false,
  style,
}: {
  /** Pill background off, for use inside an already dark card. */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      accessibilityRole="header"
      accessibilityLabel="flaminGO"
      style={[compact ? styles.compact : styles.pill, style]}
    >
      <Text style={styles.glyph}>{"\uD83E\uDDA9"}</Text>
      <Text style={styles.word} numberOfLines={1}>
        {"flamin"}
        <Text style={styles.wordGold}>{"GO"}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: withAlpha(colors.ink, 0.72),
    borderWidth: 1,
    borderColor: colors.divider,
  },
  compact: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  glyph: { fontSize: 15, lineHeight: 20 },
  word: {
    ...typography.label,
    color: colors.textOnDark,
    writingDirection: "ltr",
  },
  wordGold: { color: colors.gold },
});
