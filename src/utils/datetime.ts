/**
 * Deterministic local date formatting.
 *
 * Intl is not relied on here: Hermes ships without full ICU in some release
 * configurations, and a notification list that renders "Invalid Date" on one
 * device build is worse than a plain fixed format. This is display-only - every
 * timestamp is stored and compared as ISO on the server.
 */
function pad(value: number): string {
  return value < 10 ? "0" + value : String(value);
}

/** `YYYY-MM-DD HH:mm` in the device's local time, or an em dash if unparsable. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "\u2014";
  const date = new Date(iso);
  const time = date.getTime();
  if (Number.isNaN(time)) return "\u2014";
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    " " +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes())
  );
}
