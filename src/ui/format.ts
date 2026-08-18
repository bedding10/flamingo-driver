/**
 * Number and money formatting.
 *
 * Written by hand rather than with `Intl`: Hermes ships a partial ICU and the
 * app must render the same fare on every device, so grouping is done here
 * instead of depending on what the engine happens to support.
 */

const CURRENCY_LABEL: Record<string, string> = {
  DZD: "دج",
  EUR: "€",
  USD: "$",
};

/** 1234567.5 -> "1,234,567.50" */
export function formatAmount(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "—";
  const fixed = Math.abs(value).toFixed(decimals);
  const [whole, fraction] = fixed.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const sign = value < 0 ? "-" : "";
  return fraction ? `${sign}${grouped}.${fraction}` : `${sign}${grouped}`;
}

/** Money as the driver reads it: amount then currency label. */
export function formatMoney(
  value: number,
  currency = "DZD",
  decimals = 2,
): string {
  const label = CURRENCY_LABEL[currency] ?? currency;
  return `${formatAmount(value, decimals)} ${label}`;
}

/** 12.4 -> "12.4 كم" */
export function formatDistanceKm(km: number): string {
  if (!Number.isFinite(km)) return "—";
  return km < 1 ? `${Math.round(km * 1000)} م` : `${km.toFixed(1)} كم`;
}

/** Whole minutes, for an ETA chip. */
export function formatMinutes(minutes: number): string {
  if (!Number.isFinite(minutes)) return "—";
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m} د`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h} س ${rest} د` : `${h} س`;
}

/** mm:ss, for a countdown label. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
