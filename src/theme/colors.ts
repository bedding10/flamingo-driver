/**
 * PHASE 7.5 - flaminGO brand colours.
 *
 * The single brand accent is FLAMINGO PINK. Gold is gone from the interface.
 *
 * Why the four `gold*` keys still exist below: eleven screens built in PHASES
 * 1-7 import `colors.gold` directly. Deleting the keys would break the
 * TypeScript build in files this phase does not touch; leaving them pointing at
 * a gold hex would leave gold on screen. So they are kept as DEPRECATED ALIASES
 * that now resolve to the pink scale - every screen that was gold is pink from
 * this commit on, with zero risk of a broken import, and each converted screen
 * drops the alias as it is rewritten. No gold hex value exists in this file.
 *
 * `colors` itself is the DARK palette, which is what every unconverted screen
 * still renders. Light mode lives in `palettes.ts` and is read through
 * `useTheme()`.
 *
 * withAlpha() parses #RRGGBB only, so every value here that a component may
 * pass to it is a plain hex - never an rgba() string.
 */

/** The flamingo scale. 500 is the primary brand pink. */
export const flamingo = {
  50: "#FFF2F6",
  100: "#FFE3EC",
  200: "#FFC4D8",
  300: "#FF9EBF",
  400: "#FF76A5",
  500: "#FF4D8D",
  600: "#E63C77",
  700: "#C22860",
  800: "#8E1B45",
} as const;

export const colors = {
  // ---- brand -------------------------------------------------------------
  primary: flamingo[500],
  primarySoft: flamingo[300],
  primaryDeep: flamingo[700],
  /** Pink that still reads as text on a white surface. */
  primaryOnLight: flamingo[700],
  /** Text/icon colour placed on top of a filled pink surface. */
  onPrimary: "#FFFFFF",

  // ---- DEPRECATED gold aliases (now pink). Do not use in new code. --------
  gold: flamingo[500],
  goldSoft: flamingo[300],
  goldDeep: flamingo[700],
  goldOnLight: flamingo[700],

  // ---- neutrals (dark) ---------------------------------------------------
  ink: "#14161A",
  surfaceDark: "#1D2025",
  surfaceDarkRaised: "#262A31",
  white: "#FFFFFF",
  offWhite: "#F5F6F8",

  // ---- text --------------------------------------------------------------
  textPrimary: "#14161A",
  textSecondary: "#5C6270",
  textOnDark: "#FFFFFF",
  textOnDarkSecondary: "#A5ACBA",

  // ---- lines and scrims --------------------------------------------------
  divider: "rgba(255,255,255,0.10)",
  dividerOnLight: "rgba(20,22,26,0.10)",
  scrim: "rgba(0,0,0,0.55)",
  pressed: "rgba(255,77,141,0.14)",
  glow: "rgba(255,77,141,0.30)",

  // ---- semantic ----------------------------------------------------------
  /** Secondary accent, kept for route/leg contrast against pink. */
  coral: "#FF6F61",
  coralDeep: "#D9534A",
  routeActive: "#3FB6A8",
  online: "#1DB954",
  offline: "#6B7078",
  busy: "#4C8DFF",
  danger: "#E5484D",
  warning: "#E8A33D",
  info: "#4C8DFF",
} as const;

export type Colors = typeof colors;

/**
 * Adds an alpha channel to a #RRGGBB value.
 *
 * It deliberately does NOT accept rgba()/named colours: silently returning an
 * invalid colour string would fail only on device, so an unsupported input
 * throws in development instead.
 */
export function withAlpha(hex: string, alpha: number): string {
  const match = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!match) {
    if (__DEV__) {
      throw new Error("withAlpha expects #RRGGBB, received: " + hex);
    }
    return hex;
  }
  const value = parseInt(match[1], 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  const a = Math.max(0, Math.min(1, alpha));
  return "rgba(" + r + "," + g + "," + b + "," + a + ")";
}
