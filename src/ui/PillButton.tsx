import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import {
  COLORS,
  GLOW_PRIMARY,
  ICON_SIZE,
  RADIUS,
  SPACING,
  TOUCH_TARGET,
  typo,
} from "../theme/tokens";

/**
 * Component 3 - Pill buttons.
 * primary   -> filled primary-container, bold label, pink glow shadow
 * secondary -> transparent, 1.5px surface-variant outline, no shadow
 * danger    -> error-container fill (SOS / cancel)
 * Both are full-rounded with a 48px minimum height.
 */
export type PillButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "danger";
  trailingIcon?: keyof typeof MaterialIcons.glyphMap;
  leadingIcon?: keyof typeof MaterialIcons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  /** flex-1 / flex-[2] in the reference action rows */
  flex?: number;
  style?: StyleProp<ViewStyle>;
};

export function PillButton({
  label,
  onPress,
  variant = "primary",
  trailingIcon,
  leadingIcon,
  loading = false,
  disabled = false,
  flex,
  style,
}: PillButtonProps) {
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";
  const fg = isPrimary
    ? COLORS.onPrimaryContainer
    : isDanger
      ? COLORS.onErrorContainer
      : COLORS.onSurface;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading }}
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        isPrimary && styles.primary,
        isPrimary && GLOW_PRIMARY,
        isDanger && styles.danger,
        variant === "secondary" && styles.secondary,
        flex != null && { flex },
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.content}>
          {leadingIcon ? (
            <MaterialIcons name={leadingIcon} size={ICON_SIZE.md} color={fg} />
          ) : null}
          <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
            {label}
          </Text>
          {trailingIcon ? (
            <MaterialIcons name={trailingIcon} size={ICON_SIZE.md} color={fg} />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: TOUCH_TARGET,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { backgroundColor: COLORS.primaryContainer },
  danger: { backgroundColor: COLORS.errorContainer },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: COLORS.surfaceVariant,
  },
  content: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  label: { ...typo("labelMd"), fontWeight: "700" },
  pressed: { transform: [{ scale: 0.97 }] },
  disabled: { opacity: 0.5 },
});
