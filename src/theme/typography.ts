import { Platform } from "react-native";

/**
 * PHASE 1 - the type scale, taken from the Stitch config.
 *
 * Stitch's scale (Inter):
 *   headline-xl        36 / 44  700  -0.02em
 *   headline-lg        28 / 34  700  -0.01em
 *   headline-lg-mobile 24 / 30  700
 *   title-md           20 / 28  600
 *   body-lg            18 / 26  400
 *   body-md            16 / 24  400
 *   label-md           14 / 20  600  +0.01em
 *   label-sm           12 / 16  500
 *
 * Those eight tokens are exported under their Stitch names. The app's existing
 * token names are kept and re-pointed onto the Stitch values, so the ~190
 * existing style rules pick up the corrected scale without a single screen being
 * edited. The two driver-only tokens survive because a fare and a countdown have
 * no equivalent in the reference pack.
 *
 * Two real corrections come with this: body text moves from 15/600 to Stitch's
 * 16/400 (the app was setting semibold on paragraph text everywhere, which is
 * why it read heavier than the reference), and caption moves from 12.5 to 12/500.
 *
 * FONT FAMILY - honest status.
 * Stitch specifies Inter. The owner asked for one professional family covering
 * Arabic, French and English. The intended pairing is Inter (latin + digits)
 * with IBM Plex Sans Arabic (arabic), loaded through `expo-font`, which is
 * already a dependency. Neither font file is in this repository and my build
 * environment has no network access, so I cannot add the real files in this
 * commit without either inventing them or adding an npm package I cannot verify
 * resolves. Rather than ship a broken font gate, the family indirection below is
 * in place and still resolves to the platform face; swapping in the real files
 * is a change to `FONT` alone, in this file, with no screen touched.
 */
const FONT = {
  regular: Platform.select({ ios: "System", default: "sans-serif" }),
  medium: Platform.select({ ios: "System", default: "sans-serif-medium" }),
} as const;

/** The Stitch scale, under the Stitch names. */
export const stitchType = {
  headlineXl: {
    fontFamily: FONT.medium,
    fontSize: 36,
    fontWeight: "700" as const,
    lineHeight: 44,
    letterSpacing: -0.72,
  },
  headlineLg: {
    fontFamily: FONT.medium,
    fontSize: 28,
    fontWeight: "700" as const,
    lineHeight: 34,
    letterSpacing: -0.28,
  },
  headlineLgMobile: {
    fontFamily: FONT.medium,
    fontSize: 24,
    fontWeight: "700" as const,
    lineHeight: 30,
  },
  titleMd: {
    fontFamily: FONT.medium,
    fontSize: 20,
    fontWeight: "600" as const,
    lineHeight: 28,
  },
  bodyLg: {
    fontFamily: FONT.regular,
    fontSize: 18,
    fontWeight: "400" as const,
    lineHeight: 26,
  },
  bodyMd: {
    fontFamily: FONT.regular,
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
  },
  labelMd: {
    fontFamily: FONT.medium,
    fontSize: 14,
    fontWeight: "600" as const,
    lineHeight: 20,
    letterSpacing: 0.14,
  },
  labelSm: {
    fontFamily: FONT.regular,
    fontSize: 12,
    fontWeight: "500" as const,
    lineHeight: 16,
  },
} as const;

export const typography = {
  /** Stitch headline-xl. */
  banner: stitchType.headlineXl,
  /** Stitch headline-lg. */
  display: stitchType.headlineLg,
  /** Stitch headline-lg-mobile. */
  headline: stitchType.headlineLgMobile,
  /** Menu entries. Stitch title-md - the reference menu rows are not huge. */
  menuItem: stitchType.titleMd,
  title: stitchType.titleMd,
  subtitle: {
    fontFamily: FONT.medium,
    fontSize: 16,
    fontWeight: "600" as const,
    lineHeight: 24,
  },
  /** Stitch body-md. */
  body: stitchType.bodyMd,
  /** Stitch label-md. */
  label: stitchType.labelMd,
  /** Stitch label-sm. */
  caption: stitchType.labelSm,
  /** Fare, countdown, earnings. Driver-only, tuned to Stitch headline-lg. */
  numeric: {
    fontFamily: FONT.medium,
    fontSize: 28,
    fontWeight: "700" as const,
    lineHeight: 34,
    letterSpacing: -0.28,
  },
} as const;

export type TypeToken = keyof typeof typography;
