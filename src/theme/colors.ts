/**
 * flaminGO palette - shared identity with the passenger app.
 *
 * PHASE 7: the two apps were shipping different surfaces. The gold was already
 * reconciled (#D9A520), but the blacks were not: this app used #111111 /
 * #1B1B1D while the passenger app's design system defines exactly two blacks,
 * ink #1C1E22 and surfaceDark #26292E. Two products of the same company were
 * therefore rendering visibly different greys side by side on the same phone.
 * The driver app now adopts the passenger values; every screen reads these
 * tokens, so nothing else had to change.
 *
 * What is deliberately NOT copied: the driver keeps its own semantic colours
 * (online / offline / warning / routeActive). A driver works in states a
 * passenger never sees, and collapsing them into the passenger's smaller set
 * would remove information from the only screen that is watched all day.
 *
 * The neutrals are still tuned for the real working condition of a driver
 * phone: a cheap panel behind a windshield in direct sunlight.
 */
export const colors = {
  /** Canonical flaminGO brand gold. Identical to passenger src/design/theme.ts. */
  gold: "#D9A520",
  goldSoft: "#E8C766",
  goldDeep: "#B8860B",
  /** Gold text on white fails contrast; use this for text and icons. */
  goldOnLight: "#8A6A14",

  coral: "#FF6F61",
  coralDeep: "#D9534A",

  /** The single charcoal ink. Was #111111. */
  ink: "#1C1E22",
  /** The single raised surface above the ink: cards, fields, sheets. Was #1B1B1D. */
  surfaceDark: "#26292E",
  /** One step further up, for a field nested inside a card. Was #26262A. */
  surfaceDarkRaised: "#31353B",

  white: "#FFFFFF",
  offWhite: "#F6F6F7",

  textPrimary: "#1C1E22",
  textSecondary: "#5C5F66",
  textOnDark: "#FFFFFF",
  /**
   * Kept as a HEX value on purpose: it is passed through withAlpha() in places,
   * and the passenger app's rgba() form would produce NaN there.
   */
  textOnDarkSecondary: "#A8ADB6",

  divider: "rgba(255,255,255,0.10)",
  dividerOnLight: "rgba(28,30,34,0.08)",
  scrim: "rgba(0,0,0,0.55)",

  /** Gold press overlay, matching the passenger app's `pressed`. */
  pressed: "rgba(217,165,32,0.12)",
  /** Soft gold glow: focus rings, marker halo, level frames. */
  glow: "rgba(217,165,32,0.28)",

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
