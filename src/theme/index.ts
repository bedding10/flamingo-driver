/** Single import surface for the theme. */
export { colors, withAlpha, type Colors } from "./colors";
export { spacing, radius, touchTarget, iconSize } from "./spacing";
export { typography } from "./typography";

export const motion = { fast: 130, base: 190, slow: 300 } as const;

export const shadows = {
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
} as const;
