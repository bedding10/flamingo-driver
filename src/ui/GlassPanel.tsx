import React, { useMemo } from "react";
import {
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

/**
 * Chrome that floats over the map.
 *
 * Stitch draws these as `bg-surface-container/85 backdrop-blur-md`. React
 * Native has no backdrop blur on Android without a native blur view, and this
 * app must not ship a control whose text is unreadable over a lit map, so the
 * palette raises the alpha to 92% instead of pretending the blur exists. The
 * shape, elevation and radius are the reference ones.
 */
export function GlassPanel({
  children,
  rounded = "card",
  padded = true,
  style,
}: {
  children: React.ReactNode;
  rounded?: "card" | "pill" | "sheet";
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = usePalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);

  return (
    <View
      style={[
        styles.base,
        { borderRadius: radius[rounded] },
        padded ? styles.padded : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    base: {
      backgroundColor: palette.overlay,
      borderWidth: 1,
      borderColor: palette.border,
      ...shadows.floating,
    },
    padded: { padding: spacing.md, gap: spacing.sm },
  });
