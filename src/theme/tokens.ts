/**
 * flaminGo DESIGN TOKENS - the single source of truth.
 *
 * Every value below is copied verbatim from the Stitch reference pack
 * (`tailwind.config` block shared by the 56 exported driver screens:
 * new_ride_request, available_requests, passenger_chat, saved_work_zones, ...).
 *
 * RULES
 *  1. Dark theme only. The reference pack ships `darkMode: "class"` with the
 *     dark class on every screen; there is no light specification, so none is
 *     invented here.
 *  2. No hex literal may appear anywhere else in the codebase. Screens and
 *     components import from this file only.
 *  3. Typography is resolved through `typo()` at render time, not at module
 *     load, because the Inter / IBM Plex faces are registered asynchronously
 *     by `useAppFonts()` (see ./fonts.ts).
 */
import { Platform, TextStyle, ViewStyle } from "react-native";

import { resolveFamily } from "./fonts";

/* -------------------------------------------------------------------------- */
/* COLORS                                                                     */
/* -------------------------------------------------------------------------- */

export const COLORS = {
  /* Surfaces */
  background: "#101415",
  surface: "#101415",
  surfaceDim: "#101415",
  surfaceBright: "#363a3b",
  surfaceContainerLowest: "#0b0f10",
  surfaceContainerLow: "#191c1e",
  surfaceContainer: "#1d2022",
  surfaceContainerHigh: "#272a2c",
  surfaceContainerHighest: "#323537",
  surfaceVariant: "#323537",
  onSurface: "#e0e3e5",
  onSurfaceVariant: "#e1bec5",
  onBackground: "#e0e3e5",
  outline: "#a8898f",
  outlineVariant: "#594046",
  inverseSurface: "#e0e3e5",
  inverseOnSurface: "#2d3133",

  /* Primary - hot pink, the brand accent */
  primary: "#ffb1c4",
  primaryContainer: "#ff4d8d",
  onPrimary: "#65002e",
  onPrimaryContainer: "#5b0028",
  primaryFixed: "#ffd9e0",
  primaryFixedDim: "#ffb1c4",
  onPrimaryFixed: "#3f001a",
  onPrimaryFixedVariant: "#8f0043",
  inversePrimary: "#b90a5a",
  surfaceTint: "#ffb1c4",

  /* Secondary - muted blue-grey */
  secondary: "#bec6e0",
  secondaryContainer: "#3f465c",
  onSecondary: "#283044",
  onSecondaryContainer: "#adb4ce",
  secondaryFixed: "#dae2fd",
  secondaryFixedDim: "#bec6e0",
  onSecondaryFixed: "#131b2e",
  onSecondaryFixedVariant: "#3f465c",

  /* Tertiary - light blue, destination markers and icons */
  tertiary: "#b7c8e1",
  tertiaryContainer: "#8393ab",
  onTertiary: "#213145",
  onTertiaryContainer: "#1c2c40",
  tertiaryFixed: "#d3e4fe",
  tertiaryFixedDim: "#b7c8e1",
  onTertiaryFixed: "#0b1c30",
  onTertiaryFixedVariant: "#38485d",

  /* Error */
  error: "#ffb4ab",
  errorContainer: "#93000a",
  onError: "#690005",
  onErrorContainer: "#ffdad6",
} as const;

/**
 * Semantic one-offs the reference uses outside the token roles.
 * `success` is the fare / money green, `star` is the rating star.
 */
export const SEMANTIC = {
  success: "#10B981",
  star: "#EAB308",
} as const;

/**
 * Passenger / driver rank tiers (Bronze -> Legendary).
 * The reference screens show gold and silver rings only because those two
 * riders happen to be Gold and Silver tier - never hardcode a ring colour.
 */
export const RANK_RING = {
  BRONZE: "#CD7F32",
  SILVER: "#C0C0C0",
  GOLD: "#FFD700",
  DIAMOND: "#B9F2FF",
  LEGENDARY: "#FF4D8D",
} as const;

export type RankTier = keyof typeof RANK_RING;

/** Legendary is drawn as a gradient in the pack, not a flat fill. */
export const RANK_LEGENDARY_GRADIENT = ["#FF4D8D", "#1C2C40"] as const;

/** rgba() helper so screens never write a colour literal for translucency. */
export function alpha(hex: string, opacity: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/* -------------------------------------------------------------------------- */
/* SPACING / RADIUS / SIZES                                                   */
/* -------------------------------------------------------------------------- */

export const SPACING = {
  /** base unit - every gap is a multiple of this */
  base: 8,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  /** horizontal gutter between siblings */
  gutter: 16,
  /** screen container padding */
  container: 20,
  /** bottom-sheet outer margin */
  bottomSheetMargin: 12,
} as const;

/** Minimum height of anything tappable. Non negotiable. */
export const TOUCH_TARGET = 48;

export const RADIUS = {
  default: 4,
  lg: 8,
  xl: 12,
  /** reserved for cards and bottom sheets ONLY */
  card: 24,
  full: 9999,
} as const;

export const ICON_SIZE = {
  xs: 12,
  sm: 14,
  md: 18,
  lg: 24,
  xl: 28,
  avatar: 40,
} as const;

/* -------------------------------------------------------------------------- */
/* TYPOGRAPHY                                                                 */
/* -------------------------------------------------------------------------- */

type Scale = {
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  weight: "regular" | "medium" | "semiBold" | "bold";
  fontWeight: TextStyle["fontWeight"];
};

/** Inter. Letter spacing is the em value from the reference resolved to px. */
export const TYPE_SCALE: Record<string, Scale> = {
  headlineXl: { fontSize: 36, lineHeight: 44, letterSpacing: -0.72, weight: "bold", fontWeight: "700" },
  headlineLg: { fontSize: 28, lineHeight: 34, letterSpacing: -0.28, weight: "bold", fontWeight: "700" },
  headlineLgMobile: { fontSize: 24, lineHeight: 30, letterSpacing: 0, weight: "bold", fontWeight: "700" },
  titleMd: { fontSize: 20, lineHeight: 28, letterSpacing: 0, weight: "semiBold", fontWeight: "600" },
  bodyLg: { fontSize: 18, lineHeight: 26, letterSpacing: 0, weight: "regular", fontWeight: "400" },
  bodyMd: { fontSize: 16, lineHeight: 24, letterSpacing: 0, weight: "regular", fontWeight: "400" },
  labelMd: { fontSize: 14, lineHeight: 20, letterSpacing: 0.14, weight: "semiBold", fontWeight: "600" },
  labelSm: { fontSize: 12, lineHeight: 16, letterSpacing: 0, weight: "medium", fontWeight: "500" },
};

export type TypeName = keyof typeof TYPE_SCALE;

/**
 * Resolves a type style at render time.
 * `script` picks the family: Inter for Latin, IBM Plex Sans Arabic for Arabic
 * (Inter has no Arabic coverage).
 */
export function typo(
  name: TypeName,
  script: "latin" | "arabic" = "latin",
): TextStyle {
  const s = TYPE_SCALE[name];
  return {
    fontFamily: resolveFamily(script, s.weight),
    fontSize: s.fontSize,
    lineHeight: s.lineHeight,
    letterSpacing: s.letterSpacing,
    fontWeight: s.fontWeight,
  };
}

/* -------------------------------------------------------------------------- */
/* ELEVATION / GLOW                                                           */
/* -------------------------------------------------------------------------- */

/**
 * The pink glow under the primary CTA:
 * `shadow-[0_0_20px_rgba(255,77,141,0.3)]` in the reference.
 * Android cannot tint elevation, so it gets a plain elevation of the same depth.
 */
export const GLOW_PRIMARY: ViewStyle = Platform.select({
  ios: {
    shadowColor: COLORS.primaryContainer,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  default: { elevation: 8, shadowColor: COLORS.primaryContainer },
}) as ViewStyle;

/** Card shadow: `shadow-2xl shadow-primary-container/5`. */
export const SHADOW_CARD: ViewStyle = Platform.select({
  ios: {
    shadowColor: "#000000",
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
  default: { elevation: 6 },
}) as ViewStyle;

/** Bottom sheet and floating nav: the shadow points UP. */
export const SHADOW_SHEET: ViewStyle = Platform.select({
  ios: {
    shadowColor: "#000000",
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -4 },
  },
  default: { elevation: 16 },
}) as ViewStyle;

/* -------------------------------------------------------------------------- */
/* MOTION / BLUR                                                              */
/* -------------------------------------------------------------------------- */

export const MOTION = {
  fast: 130,
  base: 190,
  slow: 300,
  sheet: 500,
  pulse: 1600,
} as const;

/** expo-blur intensities used by the header and the sheet backdrop. */
export const BLUR = {
  header: 30,
  overlay: 40,
  tint: "dark" as const,
} as const;

export default {
  COLORS,
  SEMANTIC,
  RANK_RING,
  SPACING,
  RADIUS,
  TOUCH_TARGET,
  ICON_SIZE,
  TYPE_SCALE,
  MOTION,
  BLUR,
};
