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
 *
 * WHAT REACT NATIVE MIRRORS FOR YOU, AND WHAT IT DOES NOT
 * -------------------------------------------------------
 * This is the part that causes most RTL bugs, so it is written down here:
 *
 *   MIRRORS AUTOMATICALLY once `I18nManager.isRTL` is true:
 *     flexDirection "row", marginStart/End, paddingStart/End, start/end,
 *     borderStartWidth/EndWidth, and the default writing direction of text.
 *
 *   DOES NOT MIRROR - these are absolute and stay where you put them:
 *     textAlign "left"/"right", marginLeft/Right, paddingLeft/Right,
 *     left/right, transforms, and anything drawn inside an icon or image.
 *
 * So `flexDirection: "row"` is already correct in both directions and must NOT
 * be swapped to "row-reverse" by hand - doing that flips an RTL layout back to
 * LTR. `textAlign`, on the other hand, has to be resolved explicitly, which is
 * what `textAlignStart` / `textAlignEnd` below are for.
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

/** True when the layout engine is currently mirrored. */
export function isLayoutRTL(): boolean {
  try {
    return I18nManager.isRTL;
  } catch {
    return false;
  }
}

/**
 * Text alignment that follows the reading direction.
 *
 * Needed because React Native does not mirror `textAlign`. Screens should use
 * this instead of writing `textAlign: "right"`.
 *
 * Safe to call inside `makeStyles`: the direction cannot change during the
 * lifetime of the process, since flipping it requires a reload.
 */
export function textAlignStart(): "left" | "right" {
  return isLayoutRTL() ? "right" : "left";
}

export function textAlignEnd(): "left" | "right" {
  return isLayoutRTL() ? "left" : "right";
}

/**
 * A row that must NOT mirror.
 *
 * Use for sequences that read left-to-right in every language: phone numbers,
 * OTP digit boxes, licence plates, fares, timers, and any row of Latin
 * numerals. Because React Native mirrors plain `"row"` under RTL, keeping such
 * a row visually LTR means explicitly reversing it back.
 *
 * For ordinary content rows, just use `flexDirection: "row"` - it is already
 * correct in both directions.
 */
export function rowNeverMirrored(): "row" | "row-reverse" {
  return isLayoutRTL() ? "row-reverse" : "row";
}

/**
 * Which chevron means "back".
 *
 * In an RTL layout the back affordance points right. Stitch's own RTL screens
 * mirror it, and getting this wrong is the most visible RTL bug there is.
 */
export function backChevron(): "chevron-left" | "chevron-right" {
  return isLayoutRTL() ? "chevron-right" : "chevron-left";
}

/** Numeric content (fares, plates, OTP, phone) always reads LTR. */
export const NUMERIC_DIRECTION = "ltr" as const;
