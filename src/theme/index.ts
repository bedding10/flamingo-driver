/** Single import surface for the theme. */
export { colors, withAlpha, type Colors } from "./colors";
export { spacing, radius, touchTarget, iconSize } from "./spacing";
export { typography, type TypeToken } from "./typography";

/**
 * Motion language, aligned with the passenger app (PHASE 7). The three
 * durations were already identical; the springs are added so a sheet, a toast
 * or a pin settles the same way in both apps.
 */
export const motion = {
  fast: 130,
  base: 190,
  slow: 300,
  /** General purpose spring (sheet, drawer). */
  spring: { damping: 18, stiffness: 220, mass: 0.9 } as const,
  springSoft: { damping: 22, stiffness: 160, mass: 1 } as const,
} as const;

/**
 * One shadow language. `soft` and `sheet` are added in PHASE 7 to match the
 * passenger set; `card` and `floating` keep their existing names because every
 * screen in this app already imports them.
 */
export const shadows = {
  soft: {
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  floating: {
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  sheet: {
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 14,
  },
} as const;
