import { MaterialIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

import { alpha, RADIUS, SPACING, typo } from "../theme/tokens";
import { useTokens, type Tokens } from "../theme/useTokens";

/**
 * Component 6 - Stat card.
 * rounded-xl, surface-container-low, bordered, uppercase label-sm caption and a
 * large bold value: green for money, primary-tinted icon + value for time.
 *
 * THEME: the money green comes from the per-mode semantic palette - the dark
 * #10B981 fails contrast on a near-white card.
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
  const t = useTokens();
  const styles = useMemo(() => makeStyles(t), [t]);

  if (tone === "time" || icon) {
    return (
      <View style={[styles.card, styles.rowCard, style]}>
        {icon ? (
          <View style={styles.iconBubble}>
            <MaterialIcons
              name={icon}
              size={t.iconSize.lg}
              color={t.colors.primary}
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
          tone === "money" && { color: t.semantic.success },
        ]}
      >
        {value}
      </Text>
      {hint ? <Text style={styles.caption}>{hint}</Text> : null}
    </View>
  );
}

function makeStyles(t: Tokens) {
  return StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: t.colors.surfaceContainerLow,
      borderRadius: RADIUS.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.surfaceVariant,
      padding: SPACING.md,
      justifyContent: "center",
    },
    rowCard: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
    rowText: { flexShrink: 1 },
    iconBubble: {
      padding: SPACING.sm,
      borderRadius: RADIUS.full,
      backgroundColor: alpha(t.colors.primary, 0.1),
    },
    caption: {
      ...typo("labelSm"),
      color: t.colors.onSurfaceVariant,
      letterSpacing: 0.6,
    },
    value: {
      ...typo("headlineLgMobile"),
      color: t.colors.onSurface,
      marginTop: SPACING.xs,
    },
    rowValue: { ...typo("titleMd"), color: t.colors.onSurface },
  });
}
