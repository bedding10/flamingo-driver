import React from "react";
import { StyleSheet, Text, View, type ViewStyle, type StyleProp } from "react-native";
import { colors, radius, spacing, typography } from "../theme";

/** Dark surface grouping related fields, with an optional hint line. */
export function SectionCard({
  title,
  hint,
  children,
  style,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.title}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: spacing.lg,
  },
  title: {
    ...typography.subtitle,
    color: colors.textOnDark,
    textAlign: "right",
    writingDirection: "rtl",
  },
  hint: {
    ...typography.caption,
    color: colors.textOnDarkSecondary,
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: spacing.xs,
  },
  body: { marginTop: spacing.lg, gap: spacing.lg },
});
