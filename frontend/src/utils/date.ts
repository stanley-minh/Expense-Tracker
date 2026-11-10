/** Date helpers. The API exchanges dates as "YYYY-MM-DD" strings. */

/**
 * Today's date as "YYYY-MM-DD", in the user's LOCAL time zone.
 *
 * new Date().toISOString() is not used on purpose: it converts to UTC, so in
 * France between midnight and 1 a.m. (2 a.m. in summer) it would return yesterday.
 */
export function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // getMonth() starts at 0 (January)
  const day = String(now.getDate()).padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * Formats an API date for display.
 * @example formatDate("2026-11-09") // "09/11/2026"
 */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

/**
 * Returns the "YYYY-MM" month key of an API date, to group expenses by month.
 * @example monthOf("2026-11-09") // "2026-11"
 */
export function monthOf(iso: string): string {
  return iso.slice(0, 7);
}

/**
 * Current month as a French label.
 * @example currentMonthLabel() // "novembre 2026"
 */
export function currentMonthLabel(): string {
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date());
}
