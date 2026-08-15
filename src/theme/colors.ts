/**
 * flaminGO Driver palette.
 *
 * Brand tokens are the ones fixed by the product spec: gold primary, flamingo
 * coral secondary, near-black dark. The rest are neutrals needed to build
 * legible surfaces on a cheap panel behind a windshield in direct sunlight,
 * which is the real working condition of a driver phone.
 */
export const colors = {
  /**
   * Canonical flaminGO brand gold, identical to the passenger app's
   * `src/design/theme.ts`. It was #D4AF37 here, which made the same product
   * ship two different golds; #D9A520 is the one value both apps now use.
   */
  gold: "#D9A520",
  goldSoft: "#E8C766",
  goldDeep: "#B8860B",
  /** Gold text on white fails contrast; use this for text and icons. */
  goldOnLight: "#8A6A14",

  coral: "#FF6F61",
  coralDeep: "#D9534A",

  ink: "#111111",
  surfaceDark: "#1B1B1D",
  surfaceDarkRaised: "#26262A",

  white: "#FFFFFF",
  offWhite: "#F6F6F7",

  textPrimary: "#111111",
  textSecondary: "#5C5F66",
  textOnDark: "#FFFFFF",
  textOnDarkSecondary: "#A8ADB6",

  divider: "rgba(255,255,255,0.10)",
  dividerOnLight: "rgba(17,17,17,0.10)",
  scrim: "rgba(0,0,0,0.55)",

  /**
   * The in-progress leg of a trip. Deliberately NOT gold: gold means "drive to
   * the passenger", teal means "passenger on board". Kept as a token so the
   * map component carries no literal colour.
   */
  routeActive: "#3FB6A8",

  online: "#1DB954",
  offline: "#6B7078",
  danger: "#E5484D",
  warning: "#E8A33D",
  info: "#1A73E8",
} as const;

export type Colors = typeof colors;

/** Adds alpha to a #RRGGBB token without pulling in a color library. */
export function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
}
