import { I18nManager } from "react-native";
import { getLanguage, isRTLLanguage, type Language } from "./language";

/**
 * PHASE 1 - real right-to-left support.
 *
 * WHY THIS IS NOT JUST `textAlign`
 * --------------------------------
 * The previous code hardcoded `writingDirection: "rtl"` and `textAlign:
 * "right"` into the shared primitives. That is not RTL support - it is an
 * Arabic-only app. It right-aligns French and English, and it does nothing at
 * all for the things that actually have to mirror: flex row order, paddingStart
 * vs paddingLeft, back-chevron direction, drawer edge, and swipe gestures.
 *
 * Real mirroring comes from `I18nManager.forceRTL`, which flips the whole
 * layout engine. The catch is that it only takes effect after the JS bundle
 * reloads - React Native cannot re-lay-out a running app in the other
 * direction. So a language change that also changes direction has to reload,
 * and the driver is ASKED rather than having the app vanish under them
 * mid-shift.
 *
 * Boot order matters: `syncDirectionAtBoot()` must run before the first render,
 * so it is called from the module scope of `i18n/index.ts`, not from an effect.
 */

/**
 * Aligns the native layout direction with the stored language.
 *
 * Returns true when the native direction was already correct. When it returns
 * false the app is rendering in the wrong direction and needs a reload - but
 * this function never reloads on its own, because doing that during boot would
 * put a cold start into a loop.
 */
export function syncDirectionAtBoot(): boolean {
  const shouldBeRTL = isRTLLanguage(getLanguage());

  try {
    // allowRTL must be enabled for forceRTL to have any effect on iOS.
    I18nManager.allowRTL(true);

    if (I18nManager.isRTL !== shouldBeRTL) {
      I18nManager.forceRTL(shouldBeRTL);
      return false;
    }
    return true;
  } catch {
    // If the native module is unavailable the app still renders, just in the
    // platform default direction.
    return true;
  }
}

/** Does switching to this language flip the layout direction? */
export function directionWillChange(next: Language): boolean {
  try {
    return I18nManager.isRTL !== isRTLLanguage(next);
  } catch {
    return false;
  }
}

/**
 * Applies the direction for a language the driver just picked.
 * Returns whether a reload is required to finish the change.
 */
export function applyDirection(next: Language): boolean {
  const shouldBeRTL = isRTLLanguage(next);
  try {
    I18nManager.allowRTL(true);
    if (I18nManager.isRTL === shouldBeRTL) return false;
    I18nManager.forceRTL(shouldBeRTL);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reloads the bundle so a direction change takes effect.
 *
 * `expo-updates` is already a dependency and exposes `reloadAsync()`. It is
 * required dynamically so a development build without the module still
 * compiles; in that case the caller is told the reload did not happen and can
 * ask the driver to restart the app by hand. Reporting a reload that did not
 * occur would leave the driver staring at a half-mirrored screen.
 */
export async function reloadForDirectionChange(): Promise<boolean> {
  try {
    const Updates = require("expo-updates");
    if (typeof Updates?.reloadAsync !== "function") return false;
    await Updates.reloadAsync();
    return true;
  } catch {
    return false;
  }
}

/**
 * Direction-aware helpers.
 *
 * Screens should use these instead of writing `textAlign: "right"`. `start`
 * follows the reading direction; `left` never does.
 */
export function textAlignStart(): "left" | "right" {
  try {
    return I18nManager.isRTL ? "right" : "left";
  } catch {
    return "left";
  }
}

export function textAlignEnd(): "left" | "right" {
  try {
    return I18nManager.isRTL ? "left" : "right";
  } catch {
    return "right";
  }
}

/** Row direction that mirrors correctly. */
export function rowDirection(): "row" | "row-reverse" {
  try {
    return I18nManager.isRTL ? "row-reverse" : "row";
  } catch {
    return "row";
  }
}

/**
 * Which chevron means "back".
 *
 * In an RTL layout the back affordance points right. Stitch's own RTL screens
 * mirror it, and getting this wrong is the most visible RTL bug there is.
 */
export function backChevron(): "chevron-left" | "chevron-right" {
  try {
    return I18nManager.isRTL ? "chevron-right" : "chevron-left";
  } catch {
    return "chevron-left";
  }
}

/** Numeric content (fares, plates, OTP, phone) always reads LTR. */
export const NUMERIC_DIRECTION = "ltr" as const;
