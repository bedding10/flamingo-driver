import { withAlpha } from "./colors";
import { STITCH_DARK, STITCH_GLOW, STITCH_LIGHT } from "./stitch";

/**
 * PHASE 1 - the two themes, both built from the Stitch token set.
 *
 * There are exactly two: dark and light. Dark IS the Stitch reference. Light is
 * the Material 3 light counterpart of the same scheme (see `stitch.ts` for how
 * it is derived and why).
 *
 * The Palette keeps every key it had before this phase, so the screens and
 * components written in the earlier phases keep compiling and immediately render
 * in Stitch colours without being touched. The new Stitch-named keys below are
 * the roles Stitch actually uses (`surface-container-highest`,
 * `outline-variant`, `inverse-primary`, ...) and they let a component say what it
 * means instead of picking a shade.
 */
export type ThemeMode = "dark" | "light";

export type Palette = {
  mode: ThemeMode;

  // ---- roles the app already used (same names, Stitch values) ------------
  /** Screen background, behind everything. Stitch `background`. */
  background: string;
  /** Cards, sheets, the floating nav. Stitch `surface-container`. */
  surface: string;
  /** A card on a card, a pressed row. Stitch `surface-container-high`. */
  surfaceRaised: string;
  /** Inset wells, stat tiles, skeletons. Stitch `surface-container-low`. */
  surfaceSunken: string;
  /** Chrome floating over the map: Stitch's `surface-container/85`. */
  overlay: string;

  /** Hairlines. Stitch `outline-variant`. */
  border: string;
  /** Borders and dividers that must read. Stitch `outline`. */
  borderStrong: string;

  /** Stitch `on-surface`. */
  textPrimary: string;
  /** Stitch `on-surface-variant`. */
  textSecondary: string;
  textMuted: string;

  /** Filled brand surfaces. Stitch `primary-container` (#FF4D8D). */
  primary: string;
  /** Brand colour for text and icons. Stitch `primary`. */
  primaryText: string;
  primarySoft: string;
  /** Text/icon on top of `primary`. Stitch `on-primary-container`. */
  onPrimary: string;
  primaryWash: string;
  pressed: string;
  /** The Stitch pink glow. Primary call to action only. */
  glow: string;

  online: string;
  offline: string;
  busy: string;
  danger: string;
  warning: string;
  info: string;

  scrim: string;
  skeleton: string;

  // ---- Stitch roles added in PHASE 1 -------------------------------------
  surfaceLowest: string;
  surfaceHighest: string;
  surfaceBright: string;
  surfaceVariant: string;
  /** Deep brand tone, for a container behind pink text. */
  primaryContainerDeep: string;
  inversePrimary: string;
  secondary: string;
  tertiary: string;
  /** Filled destructive surface. Stitch `error-container`. */
  dangerContainer: string;
  /** Text/icon on `dangerContainer`. Stitch `on-error-container`. */
  onDangerContainer: string;
};

const dark = STITCH_DARK;
const light = STITCH_LIGHT;

export const DARK_PALETTE: Palette = {
  mode: "dark",

  background: dark.background,
  surface: dark.surfaceContainer,
  surfaceRaised: dark.surfaceContainerHigh,
  surfaceSunken: dark.surfaceContainerLow,
  // Stitch floats map chrome as `bg-surface-container/85 backdrop-blur-md`.
  // React Native has no backdrop blur on Android, so the alpha is raised to
  // keep text legible over a lit map instead of pretending the blur exists.
  overlay: withAlpha(dark.surfaceContainer, 0.92),

  border: dark.outlineVariant,
  borderStrong: dark.outline,

  textPrimary: dark.onSurface,
  textSecondary: dark.onSurfaceVariant,
  textMuted: withAlpha(dark.onSurface, 0.55),

  primary: dark.primaryContainer,
  primaryText: dark.primary,
  primarySoft: dark.primaryFixed,
  onPrimary: dark.onPrimaryContainer,
  primaryWash: withAlpha(dark.primaryContainer, 0.16),
  pressed: withAlpha(dark.primaryContainer, 0.14),
  glow: STITCH_GLOW,

  online: dark.success,
  offline: dark.outline,
  busy: dark.tertiary,
  danger: dark.error,
  warning: "#E8A33D",
  info: dark.secondary,

  scrim: "rgba(0,0,0,0.55)",
  skeleton: withAlpha(dark.onSurface, 0.08),

  surfaceLowest: dark.surfaceContainerLowest,
  surfaceHighest: dark.surfaceContainerHighest,
  surfaceBright: dark.surfaceBright,
  surfaceVariant: dark.surfaceVariant,
  primaryContainerDeep: dark.onPrimaryContainer,
  inversePrimary: dark.inversePrimary,
  secondary: dark.secondary,
  tertiary: dark.tertiary,
  dangerContainer: dark.errorContainer,
  onDangerContainer: dark.onErrorContainer,
};

export const LIGHT_PALETTE: Palette = {
  mode: "light",

  background: light.background,
  surface: light.surface,
  surfaceRaised: light.surfaceContainerHigh,
  surfaceSunken: light.surfaceContainerLow,
  overlay: withAlpha(light.surface, 0.94),

  border: light.outlineVariant,
  borderStrong: light.outline,

  textPrimary: light.onSurface,
  textSecondary: light.onSurfaceVariant,
  textMuted: withAlpha(light.onSurface, 0.55),

  // Same pink fill as dark - the brand does not change hex between themes.
  primary: light.primaryContainer,
  // Text pink is the light-scheme primary, because #FF4D8D on white fails
  // contrast at body sizes.
  primaryText: light.primary,
  primarySoft: light.primaryFixed,
  onPrimary: light.onPrimaryContainer,
  primaryWash: withAlpha(light.primaryContainer, 0.1),
  pressed: withAlpha(light.primaryContainer, 0.12),
  glow: STITCH_GLOW,

  online: light.success,
  offline: light.outline,
  busy: light.tertiary,
  danger: light.error,
  warning: "#B57414",
  info: light.secondary,

  scrim: "rgba(25,28,30,0.45)",
  skeleton: withAlpha(light.onSurface, 0.08),

  surfaceLowest: light.surfaceContainerLowest,
  surfaceHighest: light.surfaceContainerHighest,
  surfaceBright: light.surfaceBright,
  surfaceVariant: light.surfaceVariant,
  primaryContainerDeep: light.onPrimaryContainer,
  inversePrimary: light.inversePrimary,
  secondary: light.secondary,
  tertiary: light.tertiary,
  dangerContainer: light.errorContainer,
  onDangerContainer: light.onErrorContainer,
};

export const paletteFor = (mode: ThemeMode): Palette =>
  mode === "light" ? LIGHT_PALETTE : DARK_PALETTE;
