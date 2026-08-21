import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

import {
  alpha,
  COLORS,
  ICON_SIZE,
  RADIUS,
  SEMANTIC,
  SPACING,
  typo,
} from "../theme/tokens";

/**
 * Component 6 - Stat card.
 * rounded-xl, surface-container-low, bordered, uppercase label-sm caption and a
 * large bold value: green for money, primary-tinted icon + value for time.
 */
export type StatCardProps = {
  caption: string;
  value: string;
  /** money -> green value; time -> primary icon bubble + title value */
  tone?: "money" | "time" | "neutral";
  icon?: keyof typeof MaterialIcons.glyphMap;
  hint?: string;
  style?: StyleProp<ViewStyle>;
};

export function StatCard({
  caption,
  value,
  tone = "neutral",
  icon,
  hint,
  style,
}: StatCardProps) {
  if (tone === "time" || icon) {
    return (
      <View style={[styles.card, styles.rowCard, style]}>
        {icon ? (
          <View style={styles.iconBubble}>
            <MaterialIcons
              name={icon}
              size={ICON_SIZE.lg}
              color={COLORS.primary}
            />
          </View>
        ) : null}
        <View style={styles.rowText}>
          <Text style={styles.rowValue}>{value}</Text>
          <Text style={styles.caption}>{hint ?? caption}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, style]}>
      <Text style={styles.caption}>{caption.toUpperCase()}</Text>
      <Text
        style={[
          styles.value,
          tone === "money" && { color: SEMANTIC.success },
        ]}
      >
        {value}
      </Text>
      {hint ? <Text style={styles.caption}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.surfaceVariant,
    padding: SPACING.md,
    justifyContent: "center",
  },
  rowCard: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  rowText: { flexShrink: 1 },
  iconBubble: {
    padding: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: alpha(COLORS.primary, 0.1),
  },
  caption: {
    ...typo("labelSm"),
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.6,
  },
  value: {
    ...typo("headlineLgMobile"),
    color: COLORS.onSurface,
    marginTop: SPACING.xs,
  },
  rowValue: { ...typo("titleMd"), color: COLORS.onSurface },
});
