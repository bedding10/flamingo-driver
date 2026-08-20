/**
 * The design system, in one entry point.
 *
 * PHASE 1 (Stitch) restructured the colour layer:
 *  - `stitch.ts` holds the reference tokens, copied from the Stitch tailwind
 *    config. It is the source of truth and has no imports.
 *  - `palettes.ts` maps those tokens onto roles for dark and light.
 *  - `colors` is the legacy flat bag, now fed by the same tokens, kept for the
 *    files written before the theme existed. New code uses `usePalette()`.
 *  - spacing/radius/typography are the Stitch metrics and type scale.
 *  - `fonts.ts` loads the real Inter + IBM Plex Sans Arabic pairing.
 */
export {
  colors,
  flamingo,
  levelTints,
  withAlpha,
  type Colors,
} from "./colors";
export {
  LEVEL_LEGENDARY_GRADIENT,
  LEVEL_TINTS,
  STITCH_DARK,
  STITCH_GLOW,
  STITCH_GLOW_AMBIENT,
  STITCH_ICON_SIZE,
  STITCH_LIGHT,
  STITCH_METRICS,
  STITCH_MOTION,
  STITCH_RADIUS,
  STITCH_SHADOW,
  type LevelTint,
} from "./stitch";
export {
  DARK_PALETTE,
  LIGHT_PALETTE,
  paletteFor,
  type Palette,
  type ThemeMode,
} from "./palettes";
export { ThemeProvider, useTheme, usePalette } from "./ThemeProvider";
export { spacing, layout, radius, touchTarget, iconSize } from "./spacing";
export { typography, stitchType, type TypeStyle } from "./typography";
export {
  areCustomFontsAvailable,
  FONT_FAMILY,
  resolveFamily,
  useAppFonts,
} from "./fonts";

import { STITCH_MOTION, STITCH_SHADOW } from "./stitch";

/**
 * Motion. Short, calm durations: this app is used while driving, so nothing
 * should ever hold the driver's eye longer than it must.
 *
 * PHASE 1: the durations now come from `STITCH_MOTION` instead of being a
 * second, parallel set of numbers that could drift away from the tokens.
 */
export const motion = {
  fast: STITCH_MOTION.fast,
  base: STITCH_MOTION.base,
  slow: STITCH_MOTION.slow,
  pulse: STITCH_MOTION.pulse,
  shimmer: STITCH_MOTION.shimmer,
  /** Spring for tab selection and card entrance. */
  spring: { damping: 18, stiffness: 220, mass: 0.9 },
  springSoft: { damping: 22, stiffness: 160, mass: 1 },
} as const;

/**
 * Elevation.
 *
 * Stitch expresses depth with `shadow-2xl` on floating elements, an ambient
 * `0 4px 24px rgba(0,0,0,0.1)` on cards, and an upward `0 -4px 24px` under
 * sheets and the floating nav. PHASE 1 derives these from `STITCH_SHADOW` so
 * the React Native values can be checked against the reference rather than
 * trusted. The pink glow is `palette.glow` and belongs to the primary call to
 * action only - it is deliberately NOT in this table.
 *
 * `elevation` (Android) is tuned to read like the iOS shadow rather than being
 * a literal translation: Android draws elevation shadows much harder.
 */
export const shadows = {
  soft: {
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  card: {
    shadowColor: STITCH_SHADOW.card.color,
    shadowOpacity: STITCH_SHADOW.card.opacity,
    shadowRadius: STITCH_SHADOW.card.radius,
    shadowOffset: { width: 0, height: STITCH_SHADOW.card.offsetY },
    elevation: 4,
  },
  sheet: {
    shadowColor: STITCH_SHADOW.sheet.color,
    shadowOpacity: STITCH_SHADOW.sheet.opacity,
    shadowRadius: STITCH_SHADOW.sheet.radius,
    shadowOffset: { width: 0, height: STITCH_SHADOW.sheet.offsetY },
    elevation: 12,
  },
  floating: {
    shadowColor: STITCH_SHADOW.floating.color,
    shadowOpacity: STITCH_SHADOW.floating.opacity,
    shadowRadius: STITCH_SHADOW.floating.radius,
    shadowOffset: { width: 0, height: STITCH_SHADOW.floating.offsetY },
    elevation: 8,
  },
} as const;
