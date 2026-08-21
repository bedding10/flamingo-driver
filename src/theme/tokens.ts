/**
 * flaminGo DESIGN TOKENS - the single source of truth.
 *
 * Every dark value below is copied verbatim from the Stitch reference pack
 * (`tailwind.config` block shared by the 56 exported driver screens:
 * new_ride_request, available_requests, passenger_chat, saved_work_zones, ...).
 *
 * RULES
 *  1. TWO schemes: dark and light. The reference pack is dark only (all 39
 *     exported screenshots are dark), so the light scheme is DERIVED from the
 *     same Material roles - it is not a second design. See LIGHT_COLORS.
 *  2. No hex literal may appear anywhere else in the codebase. Screens and
 *     components read colours from `useTokens()` / `useColors()`, or from
 *     `COLORS` while they are still being migrated.
 *  3. Typography is resolved through `typo()` at render time, not at module
 *     load, because the Inter / IBM Plex faces are registered asynchronously
 *     by `useAppFonts()` (see ./fonts.ts).
 */
import { Platform, TextStyle, ViewStyle } from "react-native";

import { resolveFamily } from "./fonts";

/* -------------------------------------------------------------------------- */
/* COLORS                                                                     */
/* -------------------------------------------------------------------------- */

/** The Stitch scheme, unchanged. */
export const DARK_COLORS = {
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

/** Every colour role the app may read. Both schemes satisfy it exactly. */
export type ColorScheme = { readonly [K in keyof typeof DARK_COLORS]: string };

/**
 * The light scheme.
 *
 * DERIVED, NOT DESIGNED: Stitch shipped no light screen, so nothing here is
 * invented. Each role is the light-tone counterpart of the dark value from the
 * same Material tonal palette:
 *  - `primary` light is the dark scheme's `inversePrimary`, and vice versa.
 *  - `onSurface` / `onSurfaceVariant` swap ends with their dark values, which
 *    is why the pink-tinted neutral (`#574045`) survives into the light theme:
 *    the tint is part of the brand, not a dark-mode trick.
 *  - The M3 *fixed* roles are shared verbatim; fixed roles are defined to be
 *    identical in both themes.
 *  - `primaryContainer` + `onPrimaryContainer` are shared on purpose: the pink
 *    CTA is the brand mark and must look the same in both themes.
 */
export const LIGHT_COLORS: ColorScheme = {
  /* Surfaces */
  background: "#fff8f8",
  surface: "#fff8f8",
  surfaceDim: "#e6d6d8",
  surfaceBright: "#fff8f8",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#fff0f1",
  surfaceContainer: "#fbeaec",
  surfaceContainerHigh: "#f5e4e6",
  surfaceContainerHighest: "#efdfe1",
  surfaceVariant: "#f2dde1",
  onSurface: "#191c1e",
  onSurfaceVariant: "#574045",
  onBackground: "#191c1e",
  outline: "#8a7175",
  outlineVariant: "#dcc0c5",
  inverseSurface: "#2d3133",
  inverseOnSurface: "#f0f1f3",

  /* Primary */
  primary: "#b90a5a",
  primaryContainer: "#ff4d8d",
  onPrimary: "#ffffff",
  onPrimaryContainer: "#5b0028",
  primaryFixed: "#ffd9e0",
  primaryFixedDim: "#ffb1c4",
  onPrimaryFixed: "#3f001a",
  onPrimaryFixedVariant: "#8f0043",
  inversePrimary: "#ffb1c4",
  surfaceTint: "#b90a5a",

  /* Secondary */
  secondary: "#565e71",
  secondaryContainer: "#dae2fd",
  onSecondary: "#ffffff",
  onSecondaryContainer: "#131b2e",
  secondaryFixed: "#dae2fd",
  secondaryFixedDim: "#bec6e0",
  onSecondaryFixed: "#131b2e",
  onSecondaryFixedVariant: "#3f465c",

  /* Tertiary */
  tertiary: "#4f5f75",
  tertiaryContainer: "#d3e4fe",
  onTertiary: "#ffffff",
  onTertiaryContainer: "#0b1c30",
  tertiaryFixed: "#d3e4fe",
  tertiaryFixedDim: "#b7c8e1",
  onTertiaryFixed: "#0b1c30",
  onTertiaryFixedVariant: "#38485d",

  /* Error */
  error: "#ba1a1a",
  errorContainer: "#ffdad6",
  onError: "#ffffff",
  onErrorContainer: "#410002",
};

export type ThemeModeName = "dark" | "light";

export const SCHEMES: Record<ThemeModeName, ColorScheme> = {
  dark: DARK_COLORS,
  light: LIGHT_COLORS,
};

export function colorsFor(mode: ThemeModeName): ColorScheme {
  return mode === "light" ? LIGHT_COLORS : DARK_COLORS;
}

/**
 * DEPRECATED for new code - the dark scheme as a static object.
 *
 * Kept because the screens migrated before the light theme existed import it
 * directly. They are being converted to `useTokens()` one file at a time; do
 * not add new usages.
 */
export const COLORS = DARK_COLORS;

/**
 * Semantic one-offs the reference uses outside the token roles.
 * `success` is the fare / money green, `star` is the rating star.
 * The green darkens in the light theme: #10B981 on white fails contrast.
 */
export const SEMANTIC_DARK = {
  success: "#10B981",
  star: "#EAB308",
} as const;

export const SEMANTIC_LIGHT: { readonly [K in keyof typeof SEMANTIC_DARK]: string } = {
  success: "#047857",
  star: "#B45309",
};

export function semanticFor(mode: ThemeModeName) {
  return mode === "light" ? SEMANTIC_LIGHT : SEMANTIC_DARK;
}

/** DEPRECATED alias, dark values. See SEMANTIC_DARK / semanticFor(). */
export const SEMANTIC = SEMANTIC_DARK;

/**
 * Passenger / driver rank tiers (Bronze -> Legendary).
 * Theme independent: a gold ring is gold in both themes, the same way a
 * medal does not change colour indoors.
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
/* SPACING / RADIUS / SIZES  (theme independent)                              */
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
/* TYPOGRAPHY  (theme independent)                                            */
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
 * Android cannot tint elevation, so it gets a plain elevation of the same
 * depth - a documented deviation, not an oversight.
 * The CTA colour is theme independent, so this glow is too.
 */
export const GLOW_PRIMARY: ViewStyle = Platform.select({
  ios: {
    shadowColor: DARK_COLORS.primaryContainer,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  default: { elevation: 8, shadowColor: DARK_COLORS.primaryContainer },
}) as ViewStyle;

/**
 * Card shadow: `shadow-2xl shadow-primary-container/5`.
 * A 40% black blur reads as dirt on a white card, so the light scheme uses a
 * shallower, tighter shadow instead of the same values.
 */
export function shadowCard(mode: ThemeModeName): ViewStyle {
  return Platform.select({
    ios: {
      shadowColor: "#000000",
      shadowOpacity: mode === "light" ? 0.12 : 0.4,
      shadowRadius: mode === "light" ? 12 : 24,
      shadowOffset: { width: 0, height: mode === "light" ? 4 : 8 },
    },
    default: { elevation: 6 },
  }) as ViewStyle;
}

/** Bottom sheet and floating nav: the shadow points UP. */
export function shadowSheet(mode: ThemeModeName): ViewStyle {
  return Platform.select({
    ios: {
      shadowColor: "#000000",
      shadowOpacity: mode === "light" ? 0.16 : 0.5,
      shadowRadius: mode === "light" ? 16 : 24,
      shadowOffset: { width: 0, height: -4 },
    },
    default: { elevation: 16 },
  }) as ViewStyle;
}

/** DEPRECATED static forms, dark values. Prefer shadowCard/shadowSheet(mode). */
export const SHADOW_CARD: ViewStyle = shadowCard("dark");
export const SHADOW_SHEET: ViewStyle = shadowSheet("dark");

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

/**
 * expo-blur intensities used by the header and the sheet backdrop.
 * The tint MUST follow the mode: a dark blur over a light sheet turns it grey.
 */
export const BLUR_INTENSITY = {
  header: 30,
  overlay: 40,
} as const;

export function blurTint(mode: ThemeModeName): "dark" | "light" {
  return mode === "light" ? "light" : "dark";
}

/** DEPRECATED - dark tint baked in. Prefer BLUR_INTENSITY + blurTint(mode). */
export const BLUR = {
  header: BLUR_INTENSITY.header,
  overlay: BLUR_INTENSITY.overlay,
  tint: "dark" as const,
} as const;

export default {
  DARK_COLORS,
  LIGHT_COLORS,
  COLORS,
  SEMANTIC_DARK,
  SEMANTIC_LIGHT,
  RANK_RING,
  SPACING,
  RADIUS,
  TOUCH_TARGET,
  ICON_SIZE,
  TYPE_SCALE,
  MOTION,
  BLUR_INTENSITY,
};
