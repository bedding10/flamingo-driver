import { STITCH_ICON_SIZE, STITCH_METRICS, STITCH_RADIUS } from "./stitch";

/**
 * PHASE 1 - spacing and radii, aligned to the Stitch config.
 *
 * Stitch declares `base 8px`, `gutter 16px`, `container-padding 20px`,
 * `bottom-sheet-margin 12px`. The app's existing t-shirt scale already lands on
 * those numbers, so the scale is unchanged and the Stitch names are added as
 * `layout` for the places a screen should say what it is spacing rather than
 * pick a size.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
} as const;

/** The Stitch layout primitives, by their Stitch names. */
export const layout = {
  base: STITCH_METRICS.base,
  gutter: STITCH_METRICS.gutter,
  containerPadding: STITCH_METRICS.containerPadding,
  sheetMargin: STITCH_METRICS.bottomSheetMargin,
  safeAreaBottomMin: STITCH_METRICS.safeAreaBottomMin,
} as const;

/**
 * Radii - RE-MAPPED IN PHASE 1 onto the corrected Stitch scale.
 *
 * The previous mapping resolved `card` to 12px because `STITCH_RADIUS.xl` was
 * wrong (see `stitch.ts`). Stitch puts `rounded-xl` - 24px - on every card, row
 * and tile, and its own spec prose says "cards 24px radius with ambient
 * shadow". So `card` moves 12 -> 24. This is the largest single visual
 * correction in PHASE 1 and it lands on every existing screen at once, without
 * any screen being edited, because they all read `radius.card`.
 *
 * `sm`/`lg` also moved (8 -> 8, 8 -> 16) to stop two different keys silently
 * resolving to the same number.
 */
export const radius = {
  xs: STITCH_RADIUS.sm, // 4
  sm: STITCH_RADIUS.DEFAULT, // 8
  md: STITCH_RADIUS.md, // 12
  lg: STITCH_RADIUS.lg, // 16
  xl: STITCH_RADIUS.xl, // 24
  /** Cards, rows, tiles. Stitch `rounded-xl`. */
  card: STITCH_RADIUS.xl, // 24
  /** Bottom sheet top corners. Stitch `rounded-t-xl`. */
  sheet: STITCH_RADIUS.xl, // 24
  /** The few sheets Stitch draws at `rounded-t-[32px]`. */
  sheetLarge: 32,
  /** Text inputs. Stitch spec prose: "inputs 8px radius, pink focus". */
  input: STITCH_RADIUS.DEFAULT, // 8
  pill: STITCH_RADIUS.full,
} as const;

/**
 * Driver-sized hit targets.
 *
 * Stitch specifies `touch-target-min: 48px`. This app keeps a larger floor - 56
 * for ordinary controls, 72 for the accept/decline pair - as a declared UX
 * improvement: the passenger app is used standing still, the driver app is used
 * one-handed with the car in gear. 48 stays available as `stitchMin` for dense,
 * non-critical rows so the reference value is never lost.
 */
export const touchTarget = {
  normal: 56,
  critical: 72,
  stitchMin: STITCH_METRICS.touchTargetMin,
  /** Stitch draws the map FAB at 56x56. */
  fab: 56,
} as const;

export const iconSize = STITCH_ICON_SIZE;
