import { useEffect, useState } from "react";
import { Platform } from "react-native";

/**
 * PHASE 1 - the real font system.
 *
 * WHAT WAS WRONG BEFORE
 * ---------------------
 * `typography.ts` resolved every family to `System` / `sans-serif`. Stitch
 * specifies Inter, and the owner requires Arabic, French and English from one
 * professional system. Inter has no Arabic coverage, so Arabic was silently
 * falling through to whatever the device happened to ship - which is exactly
 * the "Inter alone must NOT be assumed to support Arabic" case called out in
 * the skill.
 *
 * WHAT THIS DOES
 * --------------
 * Loads two families through `expo-font` (already a dependency):
 *   - Inter                  -> Latin text and all digits
 *   - IBM Plex Sans Arabic   -> Arabic text
 *
 * They are a deliberate pair: IBM Plex Sans Arabic was drawn to sit alongside a
 * neutral grotesque, so mixed AR/FR strings do not look like two documents
 * glued together. Both ship as npm packages, so no binary is committed to this
 * repository and no network fetch happens at runtime - the faces are bundled
 * into the build by Metro.
 *
 * FAILURE BEHAVIOUR
 * -----------------
 * `useAppFonts()` never blocks the app forever. If a face fails to decode, the
 * hook still reports ready and `FONT_FAMILY` falls back to the platform face.
 * A driver must be able to open the app and go online even if a font is
 * missing; a blank splash screen is a worse outcome than the wrong typeface.
 */

/**
 * The family names Metro will register. These MUST match the keys passed to
 * `useFonts` below, and they are what `typography.ts` puts in `fontFamily`.
 */
export const FONT_FAMILY = {
  latinRegular: "Inter_400Regular",
  latinMedium: "Inter_500Medium",
  latinSemiBold: "Inter_600SemiBold",
  latinBold: "Inter_700Bold",

  arabicRegular: "IBMPlexSansArabic_400Regular",
  arabicMedium: "IBMPlexSansArabic_500Medium",
  arabicSemiBold: "IBMPlexSansArabic_600SemiBold",
  arabicBold: "IBMPlexSansArabic_700Bold",
} as const;

/** Used when a face failed to load, so text still renders. */
export const SYSTEM_FALLBACK = Platform.select({
  ios: "System",
  default: "sans-serif",
}) as string;

/**
 * Module-level flag read by `typography.ts`.
 *
 * Typography has to resolve a family name at StyleSheet-creation time, which
 * happens inside `useMemo` in most components and therefore does not re-run
 * when a hook's state changes. Rather than re-architect ~190 style rules, the
 * font gate below flips this flag BEFORE the navigator mounts, so every style
 * created afterwards sees the correct answer.
 */
let fontsAvailable = false;

export function areCustomFontsAvailable(): boolean {
  return fontsAvailable;
}

/**
 * Resolves a family name, honouring the load result.
 * `script` picks the coverage; `weight` picks the cut.
 */
export function resolveFamily(
  script: "latin" | "arabic",
  weight: "regular" | "medium" | "semiBold" | "bold",
): string {
  if (!fontsAvailable) return SYSTEM_FALLBACK;
  const key = (script === "arabic" ? "arabic" : "latin") +
    weight.charAt(0).toUpperCase() +
    weight.slice(1);
  return (FONT_FAMILY as Record<string, string>)[key] ?? SYSTEM_FALLBACK;
}

/**
 * Loads the faces and reports when the app may render.
 *
 * The dynamic `require` calls are inside the effect on purpose: if the font
 * packages are not installed yet (a fresh clone before `npm install`), the app
 * still boots on the platform face instead of throwing at module-evaluation
 * time and showing a red screen.
 */
export function useAppFonts(): { ready: boolean; usingFallback: boolean } {
  const [ready, setReady] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const Font = require("expo-font");
        const inter = require("@expo-google-fonts/inter");
        const plex = require("@expo-google-fonts/ibm-plex-sans-arabic");

        await Font.loadAsync({
          [FONT_FAMILY.latinRegular]: inter.Inter_400Regular,
          [FONT_FAMILY.latinMedium]: inter.Inter_500Medium,
          [FONT_FAMILY.latinSemiBold]: inter.Inter_600SemiBold,
          [FONT_FAMILY.latinBold]: inter.Inter_700Bold,

          [FONT_FAMILY.arabicRegular]: plex.IBMPlexSansArabic_400Regular,
          [FONT_FAMILY.arabicMedium]: plex.IBMPlexSansArabic_500Medium,
          [FONT_FAMILY.arabicSemiBold]: plex.IBMPlexSansArabic_600SemiBold,
          [FONT_FAMILY.arabicBold]: plex.IBMPlexSansArabic_700Bold,
        });

        if (cancelled) return;
        fontsAvailable = true;
        setReady(true);
      } catch {
        // Degrade, never block. See FAILURE BEHAVIOUR above.
        if (cancelled) return;
        fontsAvailable = false;
        setUsingFallback(true);
        setReady(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { ready, usingFallback };
}
