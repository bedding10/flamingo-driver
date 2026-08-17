/**
 * PHASE 1 - the Stitch design tokens, verbatim.
 *
 * This file is the single source of truth for colour in the driver app. Every
 * value in `STITCH_DARK` is copied from the Stitch reference pack
 * (`tailwind.config` in `main_driver_map` / `driver_wallet`), which the project
 * owner declared the authoritative visual reference for DARK mode. Nothing here
 * is invented, adjusted "to taste", or carried over from the old palette.
 *
 * Why the tokens live in their own module instead of inside `palettes.ts`:
 *  - a token file with no imports can be diffed against the Stitch config by
 *    eye, which is how a claim like "the colours match" is actually verified;
 *  - `palettes.ts` then only decides which token fills which ROLE, so a future
 *    correction to the reference is a one-line change here.
 *
 * LIGHT MODE: the Stitch pack contains no light specification (`darkMode:
 * "class"`, and every screen ships the dark class). Per the owner's decision,
 * light mode is kept and must be "a professional extension of the same system,
 * not a different identity" - so `STITCH_LIGHT` below is the Material 3 light
 * counterpart of this exact scheme: same pink hue family, same warm pink-leaning
 * neutral, tones from the M3 light ramp. It is derived, and it is marked so.
 */

/** DARK - copied from the Stitch tailwind config. Do not "improve" these. */
export const STITCH_DARK = {
  background: "#101415",
  surface: "#101415",
  surfaceDim: "#101415",
  surfaceContainerLowest: "#0B0F10",
  surfaceContainerLow: "#191C1E",
  surfaceContainer: "#1D2022",
  surfaceContainerHigh: "#272A2C",
  surfaceContainerHighest: "#323537",
  surfaceBright: "#363A3B",
  surfaceVariant: "#323537",

  primary: "#FFB1C4",
  primaryContainer: "#FF4D8D",
  onPrimary: "#65002E",
  onPrimaryContainer: "#5B0028",
  primaryFixed: "#FFD9E0",
  primaryFixedDim: "#FFB1C4",
  onPrimaryFixed: "#3F001A",
  onPrimaryFixedVariant: "#8F0043",
  inversePrimary: "#B90A5A",
  surfaceTint: "#FFB1C4",

  onSurface: "#E0E3E5",
  onBackground: "#E0E3E5",
  onSurfaceVariant: "#E1BEC5",
  inverseSurface: "#E0E3E5",
  inverseOnSurface: "#2D3133",

  outline: "#A8898F",
  outlineVariant: "#594046",

  secondary: "#BEC6E0",
  secondaryContainer: "#3F465C",
  onSecondary: "#283044",
  onSecondaryContainer: "#ADB4CE",

  tertiary: "#B7C8E1",
  tertiaryContainer: "#8393AB",
  onTertiary: "#213145",
  onTertiaryContainer: "#1C2C40",

  error: "#FFB4AB",
  errorContainer: "#93000A",
  onError: "#690005",
  onErrorContainer: "#FFDAD6",

  /** Stitch uses this one hex for every online / success indicator. */
  success: "#10B981",
} as const;

/**
 * LIGHT - DERIVED, not copied: the Stitch pack has no light screens.
 *
 * Construction rules, so this can be checked rather than trusted:
 *  - the primary role takes Stitch's `inverse-primary` (#B90A5A), which is by
 *    definition the light-scheme primary of this exact M3 palette;
 *  - `primary-container` stays #FF4D8D in both themes, because a brand fill that
 *    changes hex between themes stops being a brand colour;
 *  - neutrals keep the pink-leaning warm grey of the dark scheme instead of the
 *    old #F5F6F8 blue-grey, which is what made light mode look like a different
 *    product;
 *  - `success` is darkened to #0E9F6E so the online state passes contrast on
 *    white. It is the only place a Stitch hex is not reused as-is.
 */
export const STITCH_LIGHT = {
  background: "#FBF8F9",
  surface: "#FFFFFF",
  surfaceDim: "#F1EBEE",
  surfaceContainerLowest: "#FFFFFF",
  surfaceContainerLow: "#F6F1F3",
  surfaceContainer: "#FFFFFF",
  surfaceContainerHigh: "#F1EBEE",
  surfaceContainerHighest: "#EBE4E7",
  surfaceBright: "#FFFFFF",
  surfaceVariant: "#F1E3E7",

  primary: "#B90A5A",
  primaryContainer: "#FF4D8D",
  onPrimary: "#FFFFFF",
  onPrimaryContainer: "#5B0028",
  primaryFixed: "#FFD9E0",
  primaryFixedDim: "#FFB1C4",
  onPrimaryFixed: "#3F001A",
  onPrimaryFixedVariant: "#8F0043",
  inversePrimary: "#FFB1C4",
  surfaceTint: "#B90A5A",

  onSurface: "#191C1E",
  onBackground: "#191C1E",
  onSurfaceVariant: "#5B4A4E",
  inverseSurface: "#2D3133",
  inverseOnSurface: "#F1EBEE",

  outline: "#857176",
  outlineVariant: "#D8C2C7",

  secondary: "#4A5168",
  secondaryContainer: "#DAE2FD",
  onSecondary: "#FFFFFF",
  onSecondaryContainer: "#131B2E",

  tertiary: "#3E4E63",
  tertiaryContainer: "#D3E4FE",
  onTertiary: "#FFFFFF",
  onTertiaryContainer: "#0B1C30",

  error: "#BA1A1A",
  errorContainer: "#FFDAD6",
  onError: "#FFFFFF",
  onErrorContainer: "#410002",

  success: "#0E9F6E",
} as const;

/**
 * The ONLY place gold and bronze are allowed to exist.
 *
 * The owner's rule: gold/bronze belong to the account level system and its
 * avatar frames, and are banned from buttons, navigation, backgrounds, active
 * states, icons, general text, cards and ordinary screens. Keeping them in a
 * separate export named after the level system - instead of in the palette a
 * screen reads - is what makes an accidental use visible in review.
 *
 * `BRONZE` and `GOLD` are the exact hexes Stitch uses for the level ring and
 * level badges (#CD7F32 on the avatar border, #FFD700 on level artwork).
 * SILVER, DIAMOND and LEGENDARY are NOT in the Stitch pack; they are neutral /
 * blue-violet derivations pending the owner's confirmation. The level FRAME
 * artwork itself always comes from R2 (`profileFrameUrl`), so these are only a
 * ring or text tint for when no frame image is available.
 */
export const LEVEL_TINTS = {
  BRONZE: "#CD7F32",
  SILVER: "#C4CAD0",
  GOLD: "#FFD700",
  DIAMOND: "#8FD3E8",
  LEGENDARY: "#C9A0FF",
} as const;

export type LevelTint = keyof typeof LEVEL_TINTS;

/**
 * Stitch spacing primitives, from the same tailwind config.
 * `touchTargetMin` is deliberately NOT the app's touch floor - see `spacing.ts`
 * for why the driver app keeps a larger minimum.
 */
export const STITCH_METRICS = {
  base: 8,
  gutter: 16,
  containerPadding: 20,
  bottomSheetMargin: 12,
  touchTargetMin: 48,
} as const;

/** Stitch radii: DEFAULT 0.25rem, lg 0.5rem, xl 0.75rem, one 2xl 24px, full. */
export const STITCH_RADIUS = {
  DEFAULT: 4,
  lg: 8,
  xl: 12,
  xxl: 24,
  full: 9999,
} as const;

/** The pink glow Stitch puts under the primary call to action. */
export const STITCH_GLOW = "rgba(255,77,141,0.5)";
