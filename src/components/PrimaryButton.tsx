import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors, radius, touchTarget, typography, withAlpha } from "../theme";

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "gold" | "outline";
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
  variant = "gold",
  style,
}: Props) {
  const isBlocked = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isBlocked, busy: loading }}
      disabled={isBlocked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === "gold" ? styles.gold : styles.outline,
        pressed && !isBlocked ? styles.pressed : null,
        isBlocked ? styles.blocked : null,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            color={variant === "gold" ? colors.ink : colors.gold}
          />
        ) : (
          <Text
            style={[
              styles.label,
              variant === "gold" ? styles.labelOnGold : styles.labelOnDark,
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

const styles = StyleSheet.create({
  base: {
    minHeight: touchTarget.critical,
    borderRadius: radius.pill,
    justifyContent: "center",
  },
  gold: { backgroundColor: colors.gold },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: withAlpha(colors.gold, 0.55),
  },
  pressed: { opacity: 0.82 },
  blocked: { opacity: 0.5 },
  content: { alignItems: "center", justifyContent: "center" },
  label: { ...typography.label, writingDirection: "rtl" },
  labelOnGold: { color: colors.ink },
  labelOnDark: { color: colors.gold },
});
