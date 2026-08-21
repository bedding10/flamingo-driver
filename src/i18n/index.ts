import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { en, type Dictionary } from "./locales/en";
import { ar } from "./locales/ar";
import { fr } from "./locales/fr";
import {
  DEFAULT_LANGUAGE,
  getLanguage,
  isRTLLanguage,
  setStoredLanguage,
  SUPPORTED_LANGUAGES,
  type Language,
} from "./language";
import {
  applyDirection,
  directionWillChange,
  reloadForDirectionChange,
  syncDirectionAtBoot,
} from "./rtl";

export * from "./format";
export {
  DEFAULT_LANGUAGE,
  getLanguage,
  isCurrentRTL,
  isRTLLanguage,
  SUPPORTED_LANGUAGES,
  type Language,
} from "./language";
export {
  backChevron,
  isLayoutRTL,
  NUMERIC_DIRECTION,
  rowNeverMirrored,
  textAlignEnd,
  textAlignStart,
} from "./rtl";
export type { Dictionary } from "./locales/en";

/**
 * PHASE 1 - the translation runtime.
 *
 * BOOT ORDER
 * ----------
 * `syncDirectionAtBoot()` is called here at MODULE SCOPE, not inside an effect.
 * React Native cannot flip an already-mounted tree between LTR and RTL, so the
 * native direction has to be settled before the first component renders. The
 * result is exported so the app can tell the driver a restart is needed instead
 * of leaving them on a half-mirrored screen.
 */
export const DIRECTION_CORRECT_AT_BOOT = syncDirectionAtBoot();

const DICTIONARIES: Record<Language, Dictionary> = { ar, fr, en };

export function dictionaryFor(language: Language): Dictionary {
  return DICTIONARIES[language] ?? DICTIONARIES[DEFAULT_LANGUAGE];
}

/**
 * Every valid key, as a dotted path.
 *
 * This is a union of literal strings built from the English dictionary, so
 * `t("home.goOnlin")` is a compile error rather than a blank label discovered
 * by a driver. It is also why `en.ts` is the shape source.
 */
export type TranslationKey = {
  [S in keyof Dictionary]: `${S & string}.${keyof Dictionary[S] & string}`;
}[keyof Dictionary];

export type TranslationVars = Record<string, string | number>;

function interpolate(template: string, vars?: TranslationVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

/**
 * Resolves a key in a specific language.
 *
 * Missing keys fall back to the default language and then to the key itself.
 * They never throw and never render an empty string: a visible `home.goOnline`
 * on screen is a bug report, an empty button is a mystery.
 */
export function translate(
  key: TranslationKey,
  language: Language,
  vars?: TranslationVars,
): string {
  const [section, name] = key.split(".") as [keyof Dictionary, string];

  const primary = dictionaryFor(language)[section] as
    | Record<string, string>
    | undefined;
  const hit = primary?.[name];
  if (typeof hit === "string") return interpolate(hit, vars);

  const fallback = dictionaryFor(DEFAULT_LANGUAGE)[section] as
    | Record<string, string>
    | undefined;
  const fallbackHit = fallback?.[name];
  if (typeof fallbackHit === "string") return interpolate(fallbackHit, vars);

  if (__DEV__) {
    console.warn("[i18n] missing translation key: " + key);
  }
  return key;
}

/**
 * Non-hook translation, for code outside the React tree (services, socket
 * handlers, notification builders). Inside a component prefer `useTranslation`
 * so the text re-renders when the language changes.
 */
export function t(key: TranslationKey, vars?: TranslationVars): string {
  return translate(key, getLanguage(), vars);
}

type I18nContextValue = {
  language: Language;
  isRTL: boolean;
  /** "rtl" or "ltr" - handy for `writingDirection` on mixed-script text. */
  direction: "rtl" | "ltr";
  t: (key: TranslationKey, vars?: TranslationVars) => string;
  /**
   * Applies a new language.
   * Resolves to `true` when the layout direction changed and the app must
   * reload for the change to take effect.
   */
  setLanguage: (next: Language) => Promise<boolean>;
  /** Reloads the bundle. Resolves false if the reload could not be performed. */
  reload: () => Promise<boolean>;
  supported: readonly Language[];
};

const I18nContext = createContext<I18nContextValue>({
  language: DEFAULT_LANGUAGE,
  isRTL: isRTLLanguage(DEFAULT_LANGUAGE),
  direction: isRTLLanguage(DEFAULT_LANGUAGE) ? "rtl" : "ltr",
  t,
  setLanguage: async () => false,
  reload: async () => false,
  supported: SUPPORTED_LANGUAGES,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => getLanguage());

  const setLanguage = useCallback(async (next: Language) => {
    if (next === getLanguage()) return false;

    const flips = directionWillChange(next);
    setStoredLanguage(next);
    setLanguageState(next);

    // Text swaps immediately; only the direction needs the reload.
    if (flips) {
      applyDirection(next);
      return true;
    }
    return false;
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const rtl = isRTLLanguage(language);
    return {
      language,
      isRTL: rtl,
      direction: rtl ? "rtl" : "ltr",
      t: (key: TranslationKey, vars?: TranslationVars) =>
        translate(key, language, vars),
      setLanguage,
      reload: reloadForDirectionChange,
      supported: SUPPORTED_LANGUAGES,
    };
  }, [language, setLanguage]);

  // NOTE: this file is `index.ts`, not `index.tsx`, and it is imported as the
  // `../i18n` module path all over the app. A `.ts` file cannot contain JSX -
  // Babel reads `<I18nContext.Provider ...>` as TypeScript type parameters and
  // the Metro bundle fails with an "unexpected token" parse error before Gradle
  // ever runs. `React.createElement` is the same element without the JSX
  // syntax, so the module entry point keeps its name and every import stays
  // untouched.
  return React.createElement(
    I18nContext.Provider,
    { value },
    children,
  );
}

export function useTranslation(): I18nContextValue {
  return useContext(I18nContext);
}
