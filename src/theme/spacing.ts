import { STITCH_METRICS, STITCH_RADIUS } from "./stitch";

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
} as const;

/**
 * Radii. Stitch uses DEFAULT 4, lg 8, xl 12, one 2xl 24, and `full`.
 *
 * `card` moves from 16 to the Stitch xl (12): every card, row and tile in the
 * reference pack is `rounded-xl`. `sheet` takes the 24 Stitch uses for the large
 * sheet corner. The old key names are kept so no screen has to change to pick up
 * the corrected radius.
 */
export const radius = {
  xs: STITCH_RADIUS.DEFAULT,
  sm: STITCH_RADIUS.lg,
  md: STITCH_RADIUS.xl,
  lg: STITCH_RADIUS.lg,
  xl: STITCH_RADIUS.xl,
  card: STITCH_RADIUS.xl,
  sheet: STITCH_RADIUS.xxl,
  pill: STITCH_RADIUS.full,
} as const;

/**
 * Driver-sized hit targets.
 *
 * Stitch specifies `touch-target-min: 48px`. This app keeps a larger floor - 56
 * for ordinary controls, 72 for the accept/decline pair - as a declared UX
 * improvement under the owner's rule 9: the passenger app is used standing
 * still, the driver app is used one-handed with the car in gear. 48 stays
 * available as `stitchMin` for dense, non-critical rows so the reference value
 * is never lost.
 */
export const touchTarget = {
  normal: 56,
  critical: 72,
  stitchMin: STITCH_METRICS.touchTargetMin,
} as const;

/** Stitch renders map FABs at 56x56 with a 24-28px glyph. */
export const iconSize = { sm: 16, md: 20, lg: 24, xl: 28 } as const;
