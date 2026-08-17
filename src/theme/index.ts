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
 */
export {
  colors,
  flamingo,
  levelTints,
  withAlpha,
  type Colors,
} from "./colors";
export {
  LEVEL_TINTS,
  STITCH_DARK,
  STITCH_GLOW,
  STITCH_LIGHT,
  STITCH_METRICS,
  STITCH_RADIUS,
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
export { typography, stitchType } from "./typography";

/**
 * Motion. Short, calm durations: this app is used while driving, so nothing
 * should ever hold the driver's eye longer than it must.
 */
export const motion = {
  fast: 130,
  base: 190,
  slow: 300,
  /** Spring for tab selection and card entrance. */
  spring: { damping: 18, stiffness: 220, mass: 0.9 },
  springSoft: { damping: 22, stiffness: 160, mass: 1 },
} as const;

/**
 * Elevation.
 *
 * Stitch expresses depth with `shadow-2xl` on floating elements and a coloured
 * `shadow-[0_0_24px_rgba(255,77,141,0.5)]` glow on the primary action. The four
 * levels below are the neutral equivalents; the pink glow is `palette.glow` and
 * belongs to the primary call to action only.
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
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  sheet: {
    shadowColor: "#000000",
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  floating: {
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
} as const;
