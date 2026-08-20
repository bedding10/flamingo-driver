import type { TextStyle } from "react-native";
import { getLanguage } from "../i18n/language";
import { resolveFamily } from "./fonts";

/**
 * PHASE 1 - the type scale, taken from the Stitch config.
 *
 * Stitch's scale (Inter), with its usage census across the 53 screens:
 *   headline-xl        36 / 44  700  -0.02em    (41x)
 *   headline-lg        28 / 34  700  -0.01em    (16x)
 *   headline-lg-mobile 24 / 30  700              (71x)
 *   title-md           20 / 28  600             (174x)
 *   body-lg            18 / 26  400              (10x)
 *   body-md            16 / 24  400             (199x)
 *   label-md           14 / 20  600  +0.01em    (258x)
 *   label-sm           12 / 16  500             (291x)
 *
 * Those eight tokens are exported under their Stitch names. The app's existing
 * token names are kept and re-pointed onto the Stitch values, so the ~190
 * existing style rules pick up the corrected scale without a single screen being
 * edited. The two driver-only tokens survive because a fare and a countdown have
 * no equivalent in the reference pack.
 *
 * WHY THESE ARE GETTERS AND NOT A PLAIN OBJECT
 * --------------------------------------------
 * The font family cannot be decided at import time. `expo-font` finishes
 * loading after this module has already been evaluated, so a plain
 * `const typography = { banner: { fontFamily: resolveFamily(...) } }` would
 * capture the SYSTEM FALLBACK for the entire life of the process - the fonts
 * would load correctly and then never be used, which is the kind of bug that
 * looks like "the font just doesn't work".
 *
 * Defining each role as a getter moves the resolution to the moment a style is
 * built. Components build their styles inside `useMemo(() => makeStyles(...))`,
 * which runs after the font gate in `App.tsx` has released the tree, so by then
 * both the fonts and the language are settled.
 *
 * SCRIPT SELECTION
 * ----------------
 * Arabic gets IBM Plex Sans Arabic; French and English get Inter. Inter has no
 * Arabic coverage at all, so using it for Arabic means the device silently
 * substitutes an unknown face and the whole screen changes weight and rhythm.
 *
 * LINE HEIGHTS are left exactly as Stitch specifies them. Arabic ascenders and
 * diacritics are taller than Latin and may need more room - but inventing a
 * multiplier would put the app out of step with the reference on every screen.
 * This is flagged as a Visual QA item against the five RTL Stitch screens
 * rather than guessed at here.
 */

export type TypeStyle = {
  fontFamily: string;
  fontSize: number;
  fontWeight: TextStyle["fontWeight"];
  lineHeight: number;
  letterSpacing?: number;
};

type Weight = "regular" | "medium" | "semiBold" | "bold";

function script(): "latin" | "arabic" {
  return getLanguage() === "ar" ? "arabic" : "latin";
}

/**
 * Builds one role.
 *
 * `fontWeight` is kept alongside the weighted family on purpose: when a face
 * fails to load, `resolveFamily` returns the platform font and the weight is
 * the only thing left carrying the hierarchy.
 */
function role(
  weight: Weight,
  fontWeight: TextStyle["fontWeight"],
  fontSize: number,
  lineHeight: number,
  letterSpacing?: number,
): TypeStyle {
  const style: TypeStyle = {
    fontFamily: resolveFamily(script(), weight),
    fontSize,
    fontWeight,
    lineHeight,
  };
  if (letterSpacing !== undefined) style.letterSpacing = letterSpacing;
  return style;
}

/** The Stitch scale, under the Stitch names. */
export const stitchType = {
  /** 36/44 700 -0.02em */
  get headlineXl(): TypeStyle {
    return role("bold", "700", 36, 44, -0.72);
  },
  /** 28/34 700 -0.01em */
  get headlineLg(): TypeStyle {
    return role("bold", "700", 28, 34, -0.28);
  },
  /** 24/30 700 - the most common headline on mobile screens. */
  get headlineLgMobile(): TypeStyle {
    return role("bold", "700", 24, 30);
  },
  /** 20/28 600 */
  get titleMd(): TypeStyle {
    return role("semiBold", "600", 20, 28);
  },
  /** 18/26 400 */
  get bodyLg(): TypeStyle {
    return role("regular", "400", 18, 26);
  },
  /** 16/24 400 - Stitch's paragraph size. Never below this: driver legibility. */
  get bodyMd(): TypeStyle {
    return role("regular", "400", 16, 24);
  },
  /** 14/20 600 +0.01em */
  get labelMd(): TypeStyle {
    return role("semiBold", "600", 14, 20, 0.14);
  },
  /** 12/16 500 */
  get labelSm(): TypeStyle {
    return role("medium", "500", 12, 16);
  },
};

export const typography = {
  /** Stitch headline-xl. */
  get banner(): TypeStyle {
    return stitchType.headlineXl;
  },
  /** Stitch headline-lg. */
  get display(): TypeStyle {
    return stitchType.headlineLg;
  },
  /** Stitch headline-lg-mobile. */
  get headline(): TypeStyle {
    return stitchType.headlineLgMobile;
  },
  /** Menu entries. Stitch title-md - the reference menu rows are not huge. */
  get menuItem(): TypeStyle {
    return stitchType.titleMd;
  },
  get title(): TypeStyle {
    return stitchType.titleMd;
  },
  get subtitle(): TypeStyle {
    return role("semiBold", "600", 16, 24);
  },
  /** Stitch body-md. */
  get body(): TypeStyle {
    return stitchType.bodyMd;
  },
  /** Stitch label-md. */
  get label(): TypeStyle {
    return stitchType.labelMd;
  },
  /** Stitch label-sm. */
  get caption(): TypeStyle {
    return stitchType.labelSm;
  },
  /**
   * Fare, countdown, earnings.
   *
   * Driver-only, tuned to Stitch headline-lg. Numeric content always uses the
   * LATIN face even in Arabic: Algerian drivers read fares and plates in Latin
   * numerals, and IBM Plex Sans Arabic would render them in a different rhythm
   * from the rest of the app's numbers.
   */
  get numeric(): TypeStyle {
    return {
      fontFamily: resolveFamily("latin", "bold"),
      fontSize: 28,
      fontWeight: "700",
      lineHeight: 34,
      letterSpacing: -0.28,
    };
  },
};

export type TypeToken = keyof typeof typography;
