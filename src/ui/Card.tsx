import React, { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  radius,
  shadows,
  spacing,
  usePalette,
  type Palette,
} from "../theme";

export type CardTone = "surface" | "sunken" | "raised" | "brand" | "danger";

/**
 * The 12px-radius container every list, tile and panel in the pack sits in.
 *
 * `SectionCard` (title + body) stays for form sections; this is the unlabelled
 * primitive underneath it, so a card with a custom header no longer has to
 * hand-roll a surface.
 */
export function Card({
  children,
  tone = "surface",
  padded = true,
  bordered = true,
  elevated = false,
  onPress,
  style,
}: {
  children: React.ReactNode;
  tone?: CardTone;
  padded?: boolean;
  bordered?: boolean;
  elevated?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);

  const composed: StyleProp<ViewStyle> = [
    styles.base,
    styles[tone],
    padded ? styles.padded : null,
    bordered ? styles.bordered : null,
    elevated ? shadows.card : null,
    style,
  ];

  if (!onPress) return <View style={composed}>{children}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [composed, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    base: { borderRadius: radius.card, overflow: "hidden" },
    padded: { padding: spacing.lg, gap: spacing.md },
    bordered: { borderWidth: 1, borderColor: palette.border },
    pressed: { opacity: 0.85 },
    surface: { backgroundColor: palette.surface },
    sunken: { backgroundColor: palette.surfaceSunken },
    raised: { backgroundColor: palette.surfaceRaised },
    brand: { backgroundColor: palette.primaryWash },
    danger: { backgroundColor: palette.dangerContainer },
  });
