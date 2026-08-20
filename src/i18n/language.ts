import { NativeModules, Platform } from "react-native";
import { MMKV } from "react-native-mmkv";

/**
 * PHASE 1 - which language the app is in, and where that choice lives.
 *
 * This module deliberately imports nothing from `theme/` or the rest of `i18n/`.
 * `theme/typography.ts` reads it to pick a font family, so anything heavier here
 * would create an import cycle between the type system and the language system.
 *
 * Storage note: this reuses the same MMKV instance id as the theme preference
 * (`flamingo-driver-prefs`). A language choice is a cosmetic preference, not a
 * credential, so it has no business in SecureStore next to the auth tokens.
 * Reads are synchronous, which is what lets the very first frame render in the
 * right language and direction instead of flashing Arabic and correcting itself.
 */

export type Language = "ar" | "fr" | "en";

export const SUPPORTED_LANGUAGES: readonly Language[] = ["ar", "fr", "en"];

/** Arabic is the only right-to-left language the app ships. */
export const RTL_LANGUAGES: readonly Language[] = ["ar"];

export function isRTLLanguage(language: Language): boolean {
  return RTL_LANGUAGES.includes(language);
}

const STORAGE_ID = "flamingo-driver-prefs";
const LANGUAGE_KEY = "ui.language";

let store: MMKV | null = null;
try {
  store = new MMKV({ id: STORAGE_ID });
} catch {
  // A device where the native store fails to initialise must still open the
  // app. The language then follows the device for the session.
  store = null;
}

function isLanguage(value: unknown): value is Language {
  return (
    value === "ar" || value === "fr" || value === "en"
  );
}

/**
 * The device's preferred language, if the app happens to support it.
 *
 * `expo-localization` is not a dependency of this project, so the locale is
 * read from the platform modules directly. Every access is defensive: these
 * module shapes differ between RN versions and a missing key must not stop the
 * app from booting.
 */
function detectDeviceLanguage(): Language | null {
  try {
    let tag: string | undefined;

    if (Platform.OS === "ios") {
      const settings = NativeModules?.SettingsManager?.settings;
      tag =
        settings?.AppleLocale ??
        (Array.isArray(settings?.AppleLanguages)
          ? settings.AppleLanguages[0]
          : undefined);
    } else {
      tag = NativeModules?.I18nManager?.localeIdentifier;
    }

    if (typeof tag !== "string" || tag.length < 2) return null;

    const primary = tag.toLowerCase().split(/[-_]/)[0];
    return isLanguage(primary) ? primary : null;
  } catch {
    return null;
  }
}

/**
 * The fleet is in Algeria, so Arabic is the fallback rather than English:
 * a driver who has never chosen, on a device set to a language we do not ship,
 * should land on the language most of the fleet actually reads.
 */
export const DEFAULT_LANGUAGE: Language = "ar";

let current: Language = (() => {
  try {
    const raw = store?.getString(LANGUAGE_KEY);
    if (isLanguage(raw)) return raw;
  } catch {
    // fall through to detection
  }
  return detectDeviceLanguage() ?? DEFAULT_LANGUAGE;
})();

/**
 * The active language.
 *
 * This is a module-level value, not React state, on purpose: `typography.ts`
 * has to answer "which font family" at StyleSheet-creation time, outside of any
 * component. React state is layered on top of this in `i18n/index.ts`.
 */
export function getLanguage(): Language {
  return current;
}

export function isCurrentRTL(): boolean {
  return isRTLLanguage(current);
}

/** Records the choice. Direction changes are handled by `rtl.ts`, not here. */
export function setStoredLanguage(language: Language): void {
  current = language;
  try {
    store?.set(LANGUAGE_KEY, language);
  } catch {
    // Persistence is best effort; the session still renders correctly.
  }
}

/** True when the driver has never made an explicit choice. */
export function hasExplicitLanguageChoice(): boolean {
  try {
    return isLanguage(store?.getString(LANGUAGE_KEY));
  } catch {
    return false;
  }
}
