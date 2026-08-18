import React, { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { radius, spacing, usePalette } from "../theme";
import { AppText } from "./AppText";
import { rtlRow } from "./rtl";

const TRACK_W = 52;
const TRACK_H = 32;
const KNOB = 26;
const PAD = 3;
const TRAVEL = TRACK_W - KNOB - PAD * 2;

/**
 * The switch of the design system: emerald when on, slate when off.
 *
 * The knob rests on the RIGHT and travels LEFT, which is the direction "on"
 * moves in an RTL layout. The transform is written explicitly rather than left
 * to I18nManager, because this app mirrors itself by hand everywhere else
 * (`row-reverse`), and a transform is not mirrored by the platform anyway.
 *
 * The whole row is the hit target, not just the 52pt track - the label is the
 * part a thumb aims at.
 */
export function Toggle({
  value,
  onValueChange,
  label,
  hint,
  disabled = false,
  style,
}: {
  value: boolean;
  onValueChange: (next: boolean) => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = usePalette();
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [anim, value]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -TRAVEL],
  });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={({ pressed }) => [
        styles.row,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      {label || hint ? (
        <View style={styles.text}>
          {label ? <AppText variant="subtitle">{label}</AppText> : null}
          {hint ? (
            <AppText variant="caption" tone="secondary">
              {hint}
            </AppText>
          ) : null}
        </View>
      ) : null}

      <View
        style={[
          styles.track,
          {
            backgroundColor: value ? palette.online : palette.surfaceSunken,
            borderColor: value ? palette.online : palette.border,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.knob,
            {
              backgroundColor: value ? palette.background : palette.textMuted,
              transform: [{ translateX }],
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    ...rtlRow,
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    minHeight: 48,
  },
  text: { flex: 1, gap: 2 },
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: radius.pill,
    borderWidth: 1,
    padding: PAD,
    // The knob starts at the physical right edge.
    alignItems: "flex-end",
    justifyContent: "center",
  },
  knob: { width: KNOB, height: KNOB, borderRadius: radius.pill },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
});
