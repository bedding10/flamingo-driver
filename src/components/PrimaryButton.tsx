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
  radius,
  touchTarget,
  typography,
  usePalette,
  withAlpha,
  type Palette,
} from "../theme";

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  /**
   * "primary" is the filled flamingo-pink button. "gold" is the PHASE 6 name
   * for the same thing and is kept only so existing callers keep compiling;
   * there is no gold anywhere in the rendered result.
   *
   * PHASE 2 adds "secondary": transparent, a 1.5px border in the slate
   * `secondary` role, slate lettering. Stitch writes it as
   * `bg-transparent border-[1.5px] border-secondary text-secondary` and its
   * spec prose says "secondary transparent + 1.5px slate border".
   *
   * It is deliberately NOT the same as "outline". Outline is pink-tinted and
   * reads as a quieter version of the brand action. Secondary reads as the
   * ALTERNATIVE action - which is what "I already have an account" is.
   */
  variant?: "primary" | "gold" | "outline" | "secondary";
  /**
   * PHASE 2. The default stays `touchTarget.critical` (72) - see the note below,
   * that height is a safety decision and no existing button moves.
   *
   * "compact" is `touchTarget.normal` (56), the height Stitch draws for auth and
   * onboarding buttons. The 72 floor exists because a driver taps in-trip
   * controls one-handed with the car in gear; the auth screens are tapped once,
   * parked, before the driver has ever taken a ride, so the reference height
   * applies and the larger floor buys nothing there.
   */
  size?: "critical" | "compact";
  style?: StyleProp<ViewStyle>;
};

/**
 * The app's main action control.
 *
 * Height is `touchTarget.critical` (72) by default: a driver taps this with one
 * hand, often moving, sometimes with gloves. Small buttons are a safety
 * problem, not a styling preference.
 */
export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  size = "critical",
  style,
}: Props) {
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const filled = variant === "primary" || variant === "gold";
  const isBlocked = disabled || loading;

  /**
   * One ink colour for both the label and the busy spinner, so the two can
   * never disagree about which variant is being drawn.
   */
  const ink = filled
    ? palette.onPrimary
    : variant === "secondary"
      ? palette.secondary
      : palette.primaryText;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isBlocked, busy: loading }}
      disabled={isBlocked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        size === "compact" ? styles.compact : null,
        filled ? styles.filled : null,
        variant === "outline" ? styles.outline : null,
        variant === "secondary" ? styles.secondary : null,
        pressed && !isBlocked ? styles.pressed : null,
        isBlocked ? styles.blocked : null,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={ink} />
        ) : (
          <Text style={[styles.label, { color: ink }]} numberOfLines={1}>
            {label}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    base: {
      minHeight: touchTarget.critical,
      borderRadius: radius.pill,
      justifyContent: "center",
    },
    /** Stitch's `min-h-[56px]` auth and onboarding button. */
    compact: { minHeight: touchTarget.normal },
    filled: { backgroundColor: palette.primary },
    outline: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: withAlpha(palette.primary, 0.55),
    },
    /**
     * The slate alternative action. `palette.secondary` is the reference
     * config's own secondary hue, used here as an ALTERNATIVE-action role, not
     * as a brand accent - section 7 reserves brand accent for the pink.
     */
    secondary: {
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: palette.secondary,
    },
    pressed: { opacity: 0.82 },
    blocked: { opacity: 0.5 },
    content: { alignItems: "center", justifyContent: "center" },
    /**
     * PHASE 1: dropped the hardcoded `writingDirection: "rtl"`. The label is
     * centred, so it needs no direction of its own - and forcing RTL here would
     * have mis-ordered punctuation in the French and English labels.
     *
     * PHASE 2: the colour moved to the `ink` prop above, so the two per-variant
     * label styles this file used to carry are gone rather than left dead.
     */
    label: { ...typography.label, textAlign: "center" },
  });
