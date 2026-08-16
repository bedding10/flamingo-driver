/**
 * Date helpers for driver documents.
 *
 * Deliberately written without Intl and without a date library:
 *
 *   - Hermes on Android ships a reduced ICU, so `toLocaleDateString("ar-DZ")`
 *     is not guaranteed to produce a correct Algerian date, and in the worst
 *     case it throws at runtime on a device we cannot reproduce.
 *   - Adding date-fns or dayjs for two format calls would grow the bundle and
 *     the lockfile for no benefit.
 *
 * The input format is fixed at YYYY-MM-DD because that is what the driver reads
 * off the document and what the server accepts (@IsDateString).
 */

/** Parses a strict YYYY-MM-DD string. Returns null for anything else. */
export function parseIsoDay(input: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  // Date.UTC rolls invalid days over (31 February becomes 3 March), so the
  // round trip below is what actually rejects an impossible date.
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

/** Digits in, YYYY-MM-DD out, so the driver never types a dash. */
export function formatDateInput(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return digits.slice(0, 4) + "-" + digits.slice(4);
  return (
    digits.slice(0, 4) + "-" + digits.slice(4, 6) + "-" + digits.slice(6)
  );
}

/** Server value (ISO-8601) -> DD/MM/YYYY for display. Never throws. */
export function formatStoredDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  const time = parsed.getTime();
  if (!Number.isFinite(time)) return null;
  const day = String(parsed.getUTCDate()).padStart(2, "0");
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  return day + "/" + month + "/" + parsed.getUTCFullYear();
}

/**
 * Whole days from now until the given date. Negative once it has passed.
 * Returns null when the value is absent or unparseable.
 */
export function daysUntil(value: string | null | undefined): number | null {
  if (!value) return null;
  const target = Date.parse(value);
  if (!Number.isFinite(target)) return null;
  return Math.ceil((target - Date.now()) / 86400000);
}
