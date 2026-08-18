import React, { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  iconSize,
  radius,
  spacing,
  touchTarget,
  usePalette,
  type Palette,
} from "../theme";
import { Icon, type IconName } from "../components/Icon";
import { AppText } from "./AppText";
import { backIcon, rtlRow } from "./rtl";

/**
 * The in-screen header used by the pack.
 *
 * Most screens in the reference draw their own title row rather than a native
 * header, because the title sits with a subtitle and an action on the same
 * line. The back affordance mirrors with the layout: in Arabic "back" points
 * right.
 */
export function AppBar({
  title,
  subtitle,
  onBack,
  actionIcon,
  onAction,
  style,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  actionIcon?: IconName;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);

  return (
    <View style={[styles.row, style]}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="رجوع"
          onPress={onBack}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Icon name={backIcon} size={iconSize.lg} color={palette.textPrimary} />
        </Pressable>
      ) : (
        <View style={styles.spacer} />
      )}

      <View style={styles.titles}>
        <AppText variant="title" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" tone="secondary" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>

      {actionIcon && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Icon
            name={actionIcon}
            size={iconSize.lg}
            color={palette.textPrimary}
          />
        </Pressable>
      ) : (
        <View style={styles.spacer} />
      )}
    </View>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    row: {
      ...rtlRow,
      alignItems: "center",
      gap: spacing.md,
      minHeight: touchTarget.stitchMin,
    },
    titles: { flex: 1, gap: 2 },
    button: {
      width: touchTarget.stitchMin,
      height: touchTarget.stitchMin,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
    },
    pressed: { backgroundColor: palette.pressed },
    spacer: { width: spacing.xs },
  });
