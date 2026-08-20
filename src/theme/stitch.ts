/**
 * PHASE 1 - the Stitch design tokens, verbatim.
 *
 * This file is the single source of truth for colour, radius, elevation and
 * motion in the driver app. Every value in `STITCH_DARK` is copied from the
 * Stitch reference pack (the `tailwind.config` blocks shared by the 53 exported
 * screens), which the project owner declared the authoritative visual reference
 * for DARK mode. Nothing here is invented, adjusted "to taste", or carried over
 * from the old palette.
 *
 * Why the tokens live in their own module instead of inside `palettes.ts`:
 *  - a token file with no imports can be diffed against the Stitch config by
 *    eye, which is how a claim like "the colours match" is actually verified;
 *  - `palettes.ts` then only decides which token fills which ROLE, so a future
 *    correction to the reference is a one-line change here.
 *
 * LIGHT MODE: the Stitch pack contains no light specification (`darkMode:
 * "class"`, and all 53 screens ship the dark class). Per the owner's decision,
 * light mode is a systematic translation of the same system - same geometry,
 * same spacing, same brand pink, only surfaces/text/borders/status adapt.
 *
 * ---------------------------------------------------------------------------
 * PHASE 1 CORRECTIONS (each one is a defect found by re-reading the reference,
 * not a preference):
 *
 * 1. RADIUS. The previous scale read `DEFAULT 4 / lg 8 / xl 12 / xxl 24`. The
 *    Stitch config actually overrides Tailwind's radii to
 *    `sm 4 / DEFAULT 8 / md 12 / lg 16 / xl 24`, and the pack uses `rounded-xl`
 *    98 times - on every card, row and tile. So cards were rendering at 12px
 *    against a 24px reference, which is the single largest visual delta in the
 *    app. `2xl` is NOT overridden in the config, so it keeps Tailwind's 16px;
 *    that is why `rounded-2xl` (88 uses) and `rounded-lg` (86 uses) both mean
 *    16px and are the same token here.
 *
 * 2. LEVEL TINTS. SILVER was #C4CAD0 and DIAMOND was #8FD3E8 - both invented
 *    when the reference screens had not been supplied. The screenshots show
 *    #C0C0C0 and #B9F2FF. LEGENDARY is a pink-to-navy gradient in Stitch, not a
 *    flat violet, so it is stored as its two stops.
 *
 * 3. WARNING. #E8A33D was invented. Stitch uses #F59E0B (8 occurrences).
 *
 * 4. GLOW. The pack contains two distinct pink glows - a 15px/0.3 ambient glow
 *    and a heavier CTA glow. Only one was modelled, so both are exported now.
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

  /** Stitch uses this one hex for every online / success indicator (54 uses). */
  success: "#10B981",
  /** CORRECTED in PHASE 1: was an invented #E8A33D. Stitch uses #F59E0B. */
  warning: "#F59E0B",
} as const;

/**
 * LIGHT - DERIVED, not copied: the Stitch pack has no light screens.
 *
 * Construction rules, so this can be checked rather than trusted:
 *  - the primary role takes Stitch's `inverse-primary` (#B90A5A), which is by
 *    definition the light-scheme primary of this exact M3 palette;
 *  - `primary-container` stays #FF4D8D in both themes, because a brand fill that
 *    changes hex between themes stops being a brand colour;
 *  - neutrals keep the pink-leaning warm grey of the dark scheme instead of a
 *    blue-grey, which is what would make light mode look like a different
 *    product;
 *  - `success` and `warning` are darkened so they pass contrast on white. Those
 *    are the only places a Stitch hex is not reused as-is.
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
  warning: "#B57414",
} as const;

/**
 * The ONLY place gold and bronze are allowed to exist.
 *
 * The owner's rule: gold is NOT a brand accent. It is banned from primary
 * buttons, navigation, main headings, selected states and decoration. Where
 * Stitch uses gold it is always a LEVEL or RATING status indicator, and that
 * meaning is preserved here without letting the colour leak into the palette a
 * screen reads. Keeping these in a separate export named after the level system
 * is what makes an accidental use visible in review.
 *
 * PHASE 1 correction: SILVER and DIAMOND were invented before the reference
 * screenshots existed. screen_18 (status_levels_benefits) and screen_26
 * (badges_achievements) show #C0C0C0 and #B9F2FF.
 *
 * The level FRAME artwork itself always comes from R2 (`profileFrameUrl`), so
 * these are only a ring or text tint for when no frame image is available.
 */
export const LEVEL_TINTS = {
  BRONZE: "#CD7F32",
  SILVER: "#C0C0C0",
  GOLD: "#FFD700",
  DIAMOND: "#B9F2FF",
  /** Stitch renders Legendary as a gradient, not a flat fill. See stops below. */
  LEGENDARY: "#FF4D8D",
} as const;

/** Legendary is the one level Stitch draws as a gradient (pink -> navy). */
export const LEVEL_LEGENDARY_GRADIENT = ["#FF4D8D", "#1C2C40"] as const;

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
  /** Stitch never lets the last row sit closer than this to the home bar. */
  safeAreaBottomMin: 32,
} as const;

/**
 * Stitch radii - CORRECTED IN PHASE 1.
 *
 * From the tailwind config: `sm 4 / DEFAULT 8 / md 12 / lg 16 / xl 24 / full`.
 * `2xl` is not overridden, so it keeps Tailwind's own 16px - which is why
 * `rounded-2xl` and `rounded-lg` are the same value in this pack.
 *
 * Usage census across the 53 screens, for anyone verifying the mapping:
 *   rounded-full  525x   rounded-xl  98x   rounded-2xl 88x   rounded-lg 86x
 */
export const STITCH_RADIUS = {
  sm: 4,
  DEFAULT: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

/**
 * Elevation, as Stitch actually writes it.
 *
 * The pack expresses depth with four recurring shadow strings plus Tailwind's
 * `shadow-sm` / `shadow-lg` / `shadow-2xl`. These are the literal values, so a
 * React Native shadow can be checked against the reference rather than guessed.
 * Census: shadow-2xl 73x, shadow-sm 60x, shadow-lg 37x, shadow-inner 17x.
 */
export const STITCH_SHADOW = {
  /** Ambient card shadow. */
  card: { color: "#000000", opacity: 0.1, radius: 24, offsetY: 4 },
  /** Bottom sheets and the floating nav - the shadow points UP. */
  sheet: { color: "#000000", opacity: 0.4, radius: 24, offsetY: -4 },
  /** Floating action buttons and map overlays. */
  floating: { color: "#000000", opacity: 0.4, radius: 32, offsetY: 8 },
} as const;

/**
 * The pink glows. Two distinct ones exist in the pack and they are not
 * interchangeable: the ambient glow sits under badges and level rings, the CTA
 * glow sits under the primary call to action only.
 */
export const STITCH_GLOW_AMBIENT = "rgba(255,77,141,0.3)";
export const STITCH_GLOW = "rgba(255,77,141,0.5)";

/** Stitch renders map FABs at 56x56 with a 24-28px glyph. */
export const STITCH_ICON_SIZE = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  /** The SOS / recenter FAB glyph. */
  fab: 28,
} as const;

/**
 * Motion.
 *
 * Short, calm durations: this app is used while driving, so nothing should ever
 * hold the driver's eye longer than it must. The named entries map onto the
 * animations Stitch actually uses (animate-pulse on the SOS ring, animate-spin
 * on loaders, slide-up on sheets, fade-in-up on cards).
 */
export const STITCH_MOTION = {
  fast: 130,
  base: 190,
  slow: 300,
  /** The SOS / marker pulse ring. */
  pulse: 1600,
  /** Skeleton shimmer sweep. */
  shimmer: 1200,
} as const;
