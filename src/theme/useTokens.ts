/**
 * The bridge between the theme container and the token system.
 *
 * WHY THIS FILE EXISTS: `tokens.ts` must stay a pure data module - it is
 * imported by StyleSheet.create() calls at module load, before any React tree
 * exists. So the mode-aware lookup lives here instead, and this file imports
 * ThemeProvider directly rather than `./index`, which would close an import
 * cycle (index -> tokens -> index).
 *
 * USAGE
 *
 *   const t = useTokens();
 *   const styles = useMemo(() => makeStyles(t), [t]);
 *
 * Colours must be resolved inside the component, so a static
 * `StyleSheet.create` at the bottom of a file cannot hold them any more. The
 * pattern above keeps the object identity stable between renders, so a memoised
 * child is not re-rendered by a new style object on every GPS tick.
 */
import { useMemo } from "react";
import type { ViewStyle } from "react-native";

import { useTheme } from "./ThemeProvider";
import {
  BLUR_INTENSITY,
  blurTint,
  colorsFor,
  GLOW_PRIMARY,
  ICON_SIZE,
  RADIUS,
  RANK_RING,
  semanticFor,
  shadowCard,
  shadowSheet,
  SPACING,
  TOUCH_TARGET,
  type ColorScheme,
  type ThemeModeName,
} from "./tokens";

export type Tokens = {
  mode: ThemeModeName;
  colors: ColorScheme;
  semantic: { success: string; star: string };
  rankRing: typeof RANK_RING;
  spacing: typeof SPACING;
  radius: typeof RADIUS;
  iconSize: typeof ICON_SIZE;
  touchTarget: number;
  blur: { header: number; overlay: number; tint: "dark" | "light" };
  glowPrimary: ViewStyle;
  shadowCard: ViewStyle;
  shadowSheet: ViewStyle;
};

/** Everything a screen needs, resolved for the active theme. */
export function useTokens(): Tokens {
  const { mode } = useTheme();
  return useMemo<Tokens>(() => {
    // The provider's mode is already exactly "dark" | "light" - there is no
    // "system" value to collapse here.
    const m: ThemeModeName = mode === "light" ? "light" : "dark";
    return {
      mode: m,
      colors: colorsFor(m),
      semantic: semanticFor(m),
      rankRing: RANK_RING,
      spacing: SPACING,
      radius: RADIUS,
      iconSize: ICON_SIZE,
      touchTarget: TOUCH_TARGET,
      blur: {
        header: BLUR_INTENSITY.header,
        overlay: BLUR_INTENSITY.overlay,
        tint: blurTint(m),
      },
      glowPrimary: GLOW_PRIMARY,
      shadowCard: shadowCard(m),
      shadowSheet: shadowSheet(m),
    };
  }, [mode]);
}

/** Shorthand for the common case of only needing the colour roles. */
export function useColors(): ColorScheme {
  return useTokens().colors;
}
