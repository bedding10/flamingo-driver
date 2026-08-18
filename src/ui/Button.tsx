import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  iconSize,
  radius,
  STITCH_DARK,
  touchTarget,
  spacing,
  typography,
  usePalette,
  type Palette,
} from "../theme";
import { Icon, type IconName } from "../components/Icon";
import { rtlRow } from "./rtl";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

/**
 * The action control of the design system.
 *
 * primary   - filled flamingo pink, pill, WHITE label, with the reference CTA
 *             lift shadow.
 * secondary - transparent with a 1.5px outline, exactly as the pack draws it.
 * danger    - the error container; SOS and cancel-trip only.
 * ghost     - text only, for tertiary links inside a card.
 *
 * Gold is not a variant and never will be: in this design system gold exists
 * only as a tier ring around an avatar.
 *
 * Sizes are hit targets, not paddings: 48 is the Stitch minimum, 56 the app's
 * default for a driver's thumb, 72 for the accept/decline pair.
 *
 * STITCH FIDELITY PASS - two corrections, both systemic:
 *
 * 1. THE PRIMARY LABEL IS WHITE. Every filled CTA in the reference pack is
 *    `bg-primary-container text-white` - the main button recipe is literally
 *    `w-full min-h-[56px] bg-primary-container text-white font-title-md
 *    rounded-full`. This component was painting the label with
 *    `on-primary-container` (#5B0028), a dark maroon, so every primary button in
 *    the app read as brown-on-pink instead of white-on-pink. `on-primary-
 *    container` IS correct on the navigation pill, where the reference uses it -
 *    and the tab bar still does - but not here.
 * 2. THE GLOW IS THE BUTTON GLOW. `0 0 24px rgba(255,77,141,0.5)` is the recipe
 *    the reference uses for the DRIVER PUCK on the map, and it made buttons look
 *    like they were emitting light in every direction. The pack's button shadow
 *    is a downward lift: `0 8px 16px rgba(255,77,141,0.2 - 0.4)`. That is what
 *    ships here; the puck keeps its own glow in VehicleMarker.
 *
 * Both are in this one file, so all 42 screens pick them up untouched.
 */
export function Button({
  label,
  onPress,
  variant = "primary",
  size = "lg",
  icon,
  loading = false,
  disabled = false,
  glow,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  /** Defaults to on for `primary`, off everywhere else. */
  glow?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const blocked = disabled || loading;
  const withGlow = (glow ?? variant === "primary") && !blocked;

  const labelColor =
    variant === "primary"
      ? "#FFFFFF"
      : variant === "danger"
        ? palette.onDangerContainer
        : variant === "ghost"
          ? palette.primaryText
          : palette.textPrimary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked, busy: loading }}
      disabled={blocked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        styles[variant],
        withGlow ? styles.glow : null,
        pressed && !blocked ? styles.pressed : null,
        blocked ? styles.blocked : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} />
      ) : (
        <View style={styles.content}>
          {icon ? (
            <Icon name={icon} size={iconSize.md} color={labelColor} />
          ) : null}
          <Text numberOfLines={1} style={[styles.label, { color: labelColor }]}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    base: {
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.xl,
    },
    sm: { minHeight: touchTarget.stitchMin },
    md: { minHeight: touchTarget.normal },
    lg: { minHeight: touchTarget.critical },

    primary: { backgroundColor: palette.primary },
    secondary: {
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: palette.borderStrong,
    },
    danger: { backgroundColor: palette.dangerContainer },
    ghost: { backgroundColor: "transparent" },

    // The reference BUTTON shadow: shadow-[0_8px_16px_rgba(255,77,141,0.3)].
    // shadowColor takes the solid brand hex and the alpha becomes shadowOpacity.
    glow: {
      shadowColor: STITCH_DARK.primaryContainer,
      shadowOpacity: 0.3,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },

    pressed: { opacity: 0.82 },
    blocked: { opacity: 0.5 },
    content: { ...rtlRow, alignItems: "center", gap: spacing.sm },
    label: { ...typography.label, writingDirection: "rtl" },
  });
