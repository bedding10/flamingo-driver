import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { textAlignStart } from "../i18n";
import { radius, spacing, typography, usePalette, type Palette } from "../theme";

/** Surface grouping related fields, with an optional hint line. */
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
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);

  return (
    <View style={[styles.card, style]}>
      <Text style={styles.title}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <View style={styles.body}>{children}</View>
    </View>
  );
}

/**
 * PHASE 1: `textAlign: "right"` and `writingDirection: "rtl"` were hardcoded,
 * which right-aligned French and English too. React Native does not mirror
 * `textAlign`, so it is resolved from the layout direction instead. Resolving
 * it here is safe because the direction cannot change without a reload.
 */
const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    card: {
      backgroundColor: palette.surface,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: palette.border,
      padding: spacing.lg,
    },
    title: {
      ...typography.subtitle,
      color: palette.textPrimary,
      textAlign: textAlignStart(),
    },
    hint: {
      ...typography.caption,
      color: palette.textSecondary,
      textAlign: textAlignStart(),
      marginTop: spacing.xs,
    },
    body: { marginTop: spacing.lg, gap: spacing.lg },
  });
