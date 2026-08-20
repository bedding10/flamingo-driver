import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, type IconName } from "./Icon";
import {
  spacing,
  stitchType,
  touchTarget,
  usePalette,
  type Palette,
} from "../theme";
import { textAlignStart } from "../i18n";

/**
 * PHASE 1 - the app's screen header (section 47: StitchHeader).
 *
 * WHY THIS EXISTS
 * Every pushed screen was using the native stack header. That is what made the
 * banned gold tint in RootNavigator visible across the entire app, and it also
 * means those screens cannot carry Stitch's geometry: the reference uses a 20px
 * semibold title, a 48px touch target for the back affordance, and an optional
 * single trailing action. A platform header cannot be bent into that shape, so
 * screens get this instead and turn `headerShown` off.
 *
 * DIRECTION
 * The back affordance is `Icon name="back"`, which resolves through the mirror
 * table in Icon.tsx - it points left in French and English and right in Arabic,
 * automatically. The title uses `textAlignStart()` because React Native does not
 * mirror `textAlign`.
 *
 * The row itself is a plain `"row"`: React Native mirrors it, so the back
 * affordance leads and the action trails in every language, with no
 * hand-reversing. That is the mistake this phase spent most of its time undoing.
 */
export type StitchHeaderAction = {
  icon: IconName;
  /** Used as the accessibility label - always required, never decorative. */
  label: string;
  onPress: () => void;
};

export function StitchHeader({
  title,
  subtitle,
  onBack,
  action,
  /** Draw over content (a map, an image) with no background of its own. */
  transparent = false,
  /** Skip the safe-area top inset when a parent already applied it. */
  ignoreTopInset = false,
}: {
  title: string;
  subtitle?: string | null;
  onBack?: () => void;
  action?: StitchHeaderAction;
  transparent?: boolean;
  ignoreTopInset?: boolean;
}) {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(palette), [palette]);

  return (
    <View
      style={[
        styles.root,
        transparent ? styles.transparent : styles.opaque,
        { paddingTop: (ignoreTopInset ? 0 : insets.top) + spacing.sm },
      ]}
    >
      <View style={styles.row}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            onPress={onBack}
            hitSlop={8}
            style={({ pressed }) => [
              styles.tap,
              pressed ? { backgroundColor: palette.pressed } : null,
            ]}
          >
            <Icon name="back" size={24} color={palette.textPrimary} />
          </Pressable>
        ) : (
          // Keeps the title in the same place whether or not there is a back
          // affordance, so a header does not jump between screens.
          <View style={styles.tap} />
        )}

        <View style={styles.titles}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {action ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={action.label}
            onPress={action.onPress}
            hitSlop={8}
            style={({ pressed }) => [
              styles.tap,
              pressed ? { backgroundColor: palette.pressed } : null,
            ]}
          >
            <Icon name={action.icon} size={24} color={palette.primaryText} />
          </Pressable>
        ) : (
          <View style={styles.tap} />
        )}
      </View>
    </View>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    root: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
    opaque: { backgroundColor: palette.background },
    transparent: { backgroundColor: "transparent" },
    // Plain "row" - mirrored by React Native under RTL.
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    tap: {
      width: touchTarget.stitchMin,
      height: touchTarget.stitchMin,
      borderRadius: touchTarget.stitchMin / 2,
      alignItems: "center",
      justifyContent: "center",
    },
    titles: { flex: 1, justifyContent: "center" },
    title: {
      ...stitchType.titleMd,
      color: palette.textPrimary,
      textAlign: textAlignStart(),
    },
    subtitle: {
      ...stitchType.labelSm,
      color: palette.textSecondary,
      textAlign: textAlignStart(),
    },
  });
