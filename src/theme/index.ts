/**
 * The design system, in one entry point.
 *
 * PHASE 7.5 restructured this module:
 *  - `colors` is the raw brand scale and the DARK neutral set. New code should
 *    prefer `usePalette()` so it renders correctly in both themes.
 *  - `palettes.ts` holds the two themes; `ThemeProvider` serves them.
 *  - spacing/radius/typography/shadows/motion are theme-independent and are
 *    shared with the passenger app's scale so both apps measure the same.
 */
export { colors, flamingo, withAlpha, type Colors } from "./colors";
export {
  DARK_PALETTE,
  LIGHT_PALETTE,
  paletteFor,
  type Palette,
  type ThemeMode,
} from "./palettes";
export { ThemeProvider, useTheme, usePalette } from "./ThemeProvider";
export { spacing, radius, touchTarget, iconSize } from "./spacing";
export { typography } from "./typography";

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
 * Elevation. The same four levels as the passenger app so a card in one app
 * casts the same shadow as a card in the other.
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
