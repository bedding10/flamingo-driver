import { colors, flamingo, withAlpha } from "./colors";

/**
 * PHASE 7.5 - the two themes. There are exactly two: dark and light.
 *
 * Screens must never reach for a raw hex. They read a Palette through
 * `useTheme()`, and the same component code renders both themes.
 *
 * The pink is the SAME hex in both palettes for filled elements, because a
 * brand colour that shifts between themes stops being a brand colour. What
 * changes is the pink used for text and icons on a light surface: #FF4D8D on
 * white fails contrast for small text, so light mode uses the 700 shade for
 * type and keeps 500 for fills.
 */
export type ThemeMode = "dark" | "light";

export type Palette = {
  mode: ThemeMode;

  /** Screen background, behind everything. */
  background: string;
  /** Cards, sheets, the floating nav. */
  surface: string;
  /** A card on top of a card, or a pressed row. */
  surfaceRaised: string;
  /** Inset areas: stat tiles, input wells, skeletons. */
  surfaceSunken: string;
  /** Map controls and any chrome floating over the map. */
  overlay: string;

  border: string;
  borderStrong: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  /** Filled brand surfaces: primary buttons, active nav pill, badges. */
  primary: string;
  /** Brand colour for text, icons and thin lines. Theme-aware. */
  primaryText: string;
  primarySoft: string;
  onPrimary: string;
  /** Very light pink wash for selected/active backgrounds. */
  primaryWash: string;
  pressed: string;
  glow: string;

  online: string;
  offline: string;
  busy: string;
  danger: string;
  warning: string;
  info: string;

  scrim: string;
  skeleton: string;
};

export const DARK_PALETTE: Palette = {
  mode: "dark",

  background: colors.ink,
  surface: colors.surfaceDark,
  surfaceRaised: colors.surfaceDarkRaised,
  surfaceSunken: withAlpha(colors.white, 0.06),
  overlay: withAlpha(colors.ink, 0.86),

  border: withAlpha(colors.white, 0.1),
  borderStrong: withAlpha(colors.white, 0.18),

  textPrimary: colors.white,
  textSecondary: colors.textOnDarkSecondary,
  textMuted: withAlpha(colors.white, 0.45),

  primary: flamingo[500],
  primaryText: flamingo[400],
  primarySoft: flamingo[300],
  onPrimary: colors.white,
  primaryWash: withAlpha(flamingo[500], 0.16),
  pressed: withAlpha(flamingo[500], 0.14),
  glow: withAlpha(flamingo[500], 0.3),

  online: colors.online,
  offline: colors.offline,
  busy: colors.busy,
  danger: colors.danger,
  warning: colors.warning,
  info: colors.info,

  scrim: colors.scrim,
  skeleton: withAlpha(colors.white, 0.08),
};

export const LIGHT_PALETTE: Palette = {
  mode: "light",

  background: "#F5F6F8",
  surface: colors.white,
  surfaceRaised: "#FFFFFF",
  surfaceSunken: "#F0F1F4",
  overlay: withAlpha(colors.white, 0.92),

  border: withAlpha(colors.ink, 0.09),
  borderStrong: withAlpha(colors.ink, 0.16),

  textPrimary: colors.textPrimary,
  textSecondary: colors.textSecondary,
  textMuted: withAlpha(colors.ink, 0.45),

  primary: flamingo[500],
  primaryText: flamingo[700],
  primarySoft: flamingo[300],
  onPrimary: colors.white,
  primaryWash: withAlpha(flamingo[500], 0.1),
  pressed: withAlpha(flamingo[500], 0.12),
  glow: withAlpha(flamingo[500], 0.22),

  online: "#12A150",
  offline: "#7A8091",
  busy: "#2F6FE0",
  danger: "#D32F35",
  warning: "#B57414",
  info: "#2F6FE0",

  scrim: "rgba(20,22,26,0.45)",
  skeleton: "#E7E9ED",
};

export const paletteFor = (mode: ThemeMode): Palette =>
  mode === "light" ? LIGHT_PALETTE : DARK_PALETTE;
