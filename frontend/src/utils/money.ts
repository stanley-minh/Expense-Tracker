/**
 * Money helpers. Amounts are always handled as INTEGER cents in the code;
 * euros with a comma only exist at the edges: user input and display.
 */

/** Built once and reused: creating an Intl formatter is relatively costly. */
const euroFormatter = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

/**
 * Formats cents for display, French style.
 * @example formatCents(4250) // "42,50 €"
 */
export function formatCents(cents: number): string {
  return euroFormatter.format(cents / 100);
}

/**
 * Converts what the user typed into integer cents.
 * Accepts a comma or a dot, and 0 to 2 decimals: "12" -> 1200, "3,5" -> 350, "0.29" -> 29.
 *
 * The text is parsed instead of computing parseFloat(text) * 100, because
 * binary floats are inexact: 0.29 * 100 === 28.999999999999996 in JavaScript.
 *
 * @returns The amount in cents, or null when the text is not a valid amount
 */
export function parseEurosToCents(input: string): number | null {
  // (\d+)            euros: one or more digits
  // (?:[.,](\d{1,2}))? optional: a comma or a dot, then 1 or 2 digits (cents)
  const match = input.trim().match(/^(\d+)(?:[.,](\d{1,2}))?$/);
  if (match === null) {
    return null;
  }

  const euros = Number(match[1]);
  // padEnd: "5" means 50 cents (3,5 € = 3,50 €), "" means 0 cents
  const cents = Number((match[2] ?? "").padEnd(2, "0"));

  return euros * 100 + cents; // only integers: always exact
}
