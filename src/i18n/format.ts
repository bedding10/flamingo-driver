import { getLanguage, type Language } from "./language";

/**
 * PHASE 1 - number, currency, date and plural formatting.
 *
 * Centralised because these are the details that make a translated app look
 * translated rather than localised, and because the backend is authoritative
 * for every monetary value: nothing here computes an amount, it only renders
 * one that the server already decided.
 */

/** Algeria. The backend returns DZD and the app never converts. */
export const CURRENCY_CODE = "DZD";

const LOCALE_TAG: Record<Language, string> = {
  ar: "ar-DZ",
  fr: "fr-DZ",
  en: "en-DZ",
};

function tagFor(language?: Language): string {
  return LOCALE_TAG[language ?? getLanguage()];
}

/**
 * Formats a fare, balance or fee.
 *
 * Digits stay Latin even in Arabic: Algerian drivers read prices in Latin
 * numerals, and a plate or a fare in Eastern Arabic numerals is a support call
 * waiting to happen. `numberingSystem: "latn"` is what pins that down.
 *
 * Amounts are integers in DZD - there are no centimes in practice - so the
 * default is zero fraction digits.
 */
export function formatCurrency(
  amount: number | null | undefined,
  language?: Language,
  options?: { fractionDigits?: number },
): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return "—";
  }
  const digits = options?.fractionDigits ?? 0;
  try {
    return new Intl.NumberFormat(tagFor(language), {
      style: "currency",
      currency: CURRENCY_CODE,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
      numberingSystem: "latn",
    }).format(amount);
  } catch {
    // Hermes without full ICU: fall back to a grouped integer plus the code.
    return formatNumber(amount, language, { fractionDigits: digits }) +
      " " +
      CURRENCY_CODE;
  }
}

export function formatNumber(
  value: number | null | undefined,
  language?: Language,
  options?: { fractionDigits?: number },
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const digits = options?.fractionDigits ?? 0;
  try {
    return new Intl.NumberFormat(tagFor(language), {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
      numberingSystem: "latn",
    }).format(value);
  } catch {
    return value.toFixed(digits);
  }
}

/** Distances come from the backend in kilometres. */
export function formatDistanceKm(
  km: number | null | undefined,
  language?: Language,
): string {
  if (km === null || km === undefined || Number.isNaN(km)) return "—";
  return formatNumber(km, language, { fractionDigits: km < 10 ? 1 : 0 });
}

export function formatDate(
  value: string | number | Date | null | undefined,
  language?: Language,
): string {
  const date = toDate(value);
  if (!date) return "—";
  try {
    return new Intl.DateTimeFormat(tagFor(language), {
      day: "2-digit",
      month: "short",
      year: "numeric",
      numberingSystem: "latn",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function formatTime(
  value: string | number | Date | null | undefined,
  language?: Language,
): string {
  const date = toDate(value);
  if (!date) return "—";
  try {
    return new Intl.DateTimeFormat(tagFor(language), {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      numberingSystem: "latn",
    }).format(date);
  } catch {
    return date.toISOString().slice(11, 16);
  }
}

/** mm:ss, for offer countdowns and arrival waiting displays. */
export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
}

function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Plural categories.
 *
 * This exists because Arabic does not have two plural forms, it has six
 * (zero, one, two, few, many, other), and "3 rides" and "13 rides" take
 * different words. Treating Arabic like English is the classic localisation
 * bug and it is very visible to a native reader.
 *
 * The rules below are the CLDR cardinal rules for `ar` and `fr`; English is the
 * trivial one/other. `Intl.PluralRules` is used when the runtime has it, and
 * these are the fallback for a Hermes build without full ICU.
 */
export type PluralCategory = "zero" | "one" | "two" | "few" | "many" | "other";

export type PluralForms = Partial<Record<PluralCategory, string>> & {
  other: string;
};

export function pluralCategory(
  count: number,
  language?: Language,
): PluralCategory {
  const lang = language ?? getLanguage();

  try {
    const rules = new Intl.PluralRules(LOCALE_TAG[lang]);
    return rules.select(count) as PluralCategory;
  } catch {
    // fall through to the hand-written rules
  }

  if (lang === "ar") {
    const n = Math.abs(count);
    const mod100 = n % 100;
    if (n === 0) return "zero";
    if (n === 1) return "one";
    if (n === 2) return "two";
    if (mod100 >= 3 && mod100 <= 10) return "few";
    if (mod100 >= 11 && mod100 <= 99) return "many";
    return "other";
  }

  if (lang === "fr") {
    // French treats 0 and 1 as singular.
    return Math.abs(count) < 2 ? "one" : "other";
  }

  return Math.abs(count) === 1 ? "one" : "other";
}

/**
 * Picks the right plural form and substitutes {count}.
 * Falls back through the CLDR chain so a locale that only defines `other`
 * still renders correctly.
 */
export function plural(
  count: number,
  forms: PluralForms,
  language?: Language,
): string {
  const category = pluralCategory(count, language);
  const template = forms[category] ?? forms.other;
  return template.replace(/\{count\}/g, formatNumber(count, language));
}
