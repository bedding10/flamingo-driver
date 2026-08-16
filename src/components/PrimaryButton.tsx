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
   */
  variant?: "primary" | "gold" | "outline";
  style?: StyleProp<ViewStyle>;
};

/**
 * The app's main action control.
 *
 * Height is `touchTarget.critical` (72): a driver taps this with one hand, often
 * moving, sometimes with gloves. Small buttons are a safety problem, not a
 * styling preference.
 */
export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  style,
}: Props) {
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const filled = variant !== "outline";
  const isBlocked = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isBlocked, busy: loading }}
      disabled={isBlocked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        filled ? styles.filled : styles.outline,
        pressed && !isBlocked ? styles.pressed : null,
        isBlocked ? styles.blocked : null,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            color={filled ? palette.onPrimary : palette.primaryText}
          />
        ) : (
          <Text
            style={[
              styles.label,
              filled ? styles.labelOnFilled : styles.labelOnSurface,
            ]}
            numberOfLines={1}
          >
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
    filled: { backgroundColor: palette.primary },
    outline: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: withAlpha(palette.primary, 0.55),
    },
    pressed: { opacity: 0.82 },
    blocked: { opacity: 0.5 },
    content: { alignItems: "center", justifyContent: "center" },
    label: { ...typography.label, writingDirection: "rtl" },
    labelOnFilled: { color: palette.onPrimary },
    labelOnSurface: { color: palette.primaryText },
  });
