import { LEVEL_TINTS, STITCH_DARK } from "./stitch";

/**
 * PHASE 1 - the flat colour bag, now fed by the Stitch tokens.
 *
 * `usePalette()` is the correct way for a component to read colour. This module
 * survives for two reasons only:
 *  1. a handful of files written before the theme existed still import `colors`
 *     directly (the navigator header, the approval gate, the boot and legal
 *     screens). Re-pointing the keys at Stitch values means those files render
 *     in the reference palette from this commit, before they are individually
 *     rebuilt - instead of keeping the old charcoal #14161A alive on screen.
 *  2. `withAlpha` lives here and is used everywhere.
 *
 * Every neutral below is now a Stitch hex. The old brand charcoals (#14161A,
 * #1D2025, #262A31) and the blue-grey greys are gone from the codebase.
 *
 * The `gold*` keys remain DEPRECATED PINK ALIASES: 20 call sites still import
 * `colors.gold`, and the owner's rule is that gold may appear only in the level
 * system. Pointing the alias at pink keeps gold off those screens with no risk
 * of a broken import. Real gold lives in `LEVEL_TINTS` and is re-exported below
 * under a name that says what it is for.
 *
 * NOTE FOR ANYONE AUDITING THIS FILE: because `gold` resolves to pink, finding
 * `colors.gold` at a call site does NOT mean gold is on screen there. It means
 * that call site has not been migrated to `usePalette()` yet, which is a
 * light-mode bug rather than a branding one. Judge those call sites on that.
 */

/**
 * The flamingo scale.
 *
 * 500 is #FF4D8D - the same hex as Stitch `primary-container`, which is why the
 * brand pink needed no reconciliation. The lighter steps are Stitch's own
 * primary tones; 400 and 600 are the interpolated steps the app needs for
 * pressed states, which the dark-only Stitch config does not define.
 */
export const flamingo = {
  50: "#FFF2F6",
  100: "#FFE3EC",
  200: STITCH_DARK.primaryFixed, // #FFD9E0
  300: STITCH_DARK.primary, // #FFB1C4
  400: "#FF76A5",
  500: STITCH_DARK.primaryContainer, // #FF4D8D
  600: "#E63C77",
  700: STITCH_DARK.inversePrimary, // #B90A5A
  800: STITCH_DARK.onPrimaryFixedVariant, // #8F0043
} as const;

export const colors = {
  // ---- brand -------------------------------------------------------------
  primary: flamingo[500],
  primarySoft: flamingo[300],
  primaryDeep: flamingo[700],
  primaryOnLight: flamingo[700],
  /** Text on a filled pink surface. Stitch pairs #FF4D8D with #5B0028. */
  onPrimary: STITCH_DARK.onPrimaryContainer,

  // ---- DEPRECATED gold aliases (resolve to pink). Never use in new code. --
  gold: flamingo[500],
  goldSoft: flamingo[300],
  goldDeep: flamingo[700],
  goldOnLight: flamingo[700],

  // ---- neutrals, all Stitch ----------------------------------------------
  ink: STITCH_DARK.background, // #101415
  surfaceDark: STITCH_DARK.surfaceContainer, // #1D2022
  surfaceDarkRaised: STITCH_DARK.surfaceContainerHigh, // #272A2C
  white: "#FFFFFF",
  offWhite: "#FBF8F9",

  // ---- text --------------------------------------------------------------
  textPrimary: "#191C1E",
  textSecondary: "#5B4A4E",
  textOnDark: STITCH_DARK.onSurface, // #E0E3E5
  textOnDarkSecondary: STITCH_DARK.onSurfaceVariant, // #E1BEC5

  // ---- lines and scrims --------------------------------------------------
  divider: STITCH_DARK.outlineVariant,
  dividerOnLight: "#D8C2C7",
  scrim: "rgba(0,0,0,0.55)",
  pressed: "rgba(255,77,141,0.14)",
  glow: "rgba(255,77,141,0.50)",

  // ---- semantic ----------------------------------------------------------
  /** Second route colour, so the two trip legs are distinguishable. */
  coral: STITCH_DARK.tertiary,
  coralDeep: STITCH_DARK.onTertiary,
  routeActive: STITCH_DARK.tertiary,
  online: STITCH_DARK.success, // #10B981
  offline: STITCH_DARK.outline,
  busy: STITCH_DARK.tertiary,
  danger: STITCH_DARK.error,
  /**
   * PHASE 1: was the hardcoded #E8A33D, a hex that appears NOWHERE in the
   * Stitch reference - it was invented. Stitch uses #F59E0B for warning, eight
   * times. This was the last place the invented value survived after
   * palettes.ts was corrected.
   */
  warning: STITCH_DARK.warning, // #F59E0B
  info: STITCH_DARK.secondary,
} as const;

export type Colors = typeof colors;

/** Level tints. The ONLY sanctioned use of gold and bronze. */
export const levelTints = LEVEL_TINTS;

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
