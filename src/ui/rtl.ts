import { I18nManager } from "react-native";

/**
 * RTL helpers.
 *
 * The reference pack is Arabic-first and mirrors every row: the label sits on
 * the right, the chevron and the trailing value on the left. The app already
 * writes `textAlign: "right"` by hand in ~190 places; these helpers give that
 * one name so a new screen never has to remember it.
 *
 * `I18nManager.isRTL` is read once at module load on purpose - React Native
 * only applies a direction change after a reload, so a value captured per
 * render would disagree with what the native side is actually doing.
 */
export const isRTL = I18nManager.isRTL;

/** Arabic text defaults: right aligned, RTL writing direction. */
export const rtlText = {
  textAlign: "right",
  writingDirection: "rtl",
} as const;

/** A row whose first child renders at the right edge. */
export const rtlRow = { flexDirection: "row-reverse" } as const;

/** The direction a "go back" affordance points in the current layout. */
export const backIcon = isRTL ? "forward" : "back";

/** The direction a "drill in" chevron points in the current layout. */
export const forwardChevron = isRTL ? "chevron" : "chevronRight";
