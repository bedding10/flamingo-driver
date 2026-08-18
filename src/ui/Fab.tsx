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
  shadows,
  touchTarget,
  usePalette,
  type Palette,
} from "../theme";
import { Icon, type IconName } from "../components/Icon";
import { AppText } from "./AppText";

/**
 * The round map control (recentre, layers, zones).
 *
 * 56x56 with a 24-28px glyph, which is both the reference size and above the
 * 48 minimum - these are tapped while the car is moving.
 */
export function Fab({
  icon,
  onPress,
  tone = "surface",
  badge,
  accessibilityLabel,
  style,
}: {
  icon: IconName;
  onPress: () => void;
  tone?: "surface" | "brand" | "danger";
  /** Small count bubble, e.g. unread requests. */
  badge?: number;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);

  const glyphColor =
    tone === "brand"
      ? palette.onPrimary
      : tone === "danger"
        ? palette.onDangerContainer
        : palette.textPrimary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[tone],
        pressed && styles.pressed,
        style,
      ]}
    >
      <Icon name={icon} size={iconSize.xl} color={glyphColor} />
      {badge && badge > 0 ? (
        <View style={styles.badge}>
          <AppText variant="caption" tone="onPrimary" align="center">
            {badge > 99 ? "99+" : String(badge)}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    base: {
      width: touchTarget.normal,
      height: touchTarget.normal,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: palette.border,
      ...shadows.floating,
    },
    surface: { backgroundColor: palette.overlay },
    brand: { backgroundColor: palette.primary, borderColor: palette.primary },
    danger: {
      backgroundColor: palette.dangerContainer,
      borderColor: palette.dangerContainer,
    },
    pressed: { opacity: 0.85 },
    badge: {
      position: "absolute",
      top: -2,
      right: -2,
      minWidth: 20,
      height: 20,
      paddingHorizontal: 4,
      borderRadius: radius.pill,
      backgroundColor: palette.primary,
      alignItems: "center",
      justifyContent: "center",
    },
  });
