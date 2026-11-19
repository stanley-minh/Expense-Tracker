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
 * Converts cents back into the text shown in the amount field (reverse of parseEurosToCents).
 * Uses the Euclidean division by 100: quotient = euros, remainder = cents (always 0 to 99).
 * @example centsToInputValue(4250) // "42,50"
 * @example centsToInputValue(1200) // "12,00"
 */
export function centsToInputValue(cents: number): string {
  const euros = Math.floor(cents / 100); // quotient
  const rest = cents % 100; // remainder
  return `${euros},${String(rest).padStart(2, "0")}`;
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

/** One group of identical shares, e.g. { amountCents: 3333, count: 2 } = "2 × 33,33 €". */
export interface ShareGroup {
  amountCents: number;
  count: number;
}

/**
 * Splits an amount between several people, to the exact cent.
 *
 * Euclidean division of the total by the number of people:
 *   total = quotient × people + remainder   (0 <= remainder < people)
 * Everyone pays the quotient, and the remainder (fewer cents than people) is
 * given one cent each to the first "remainder" people. The shares therefore
 * always add up EXACTLY to the total, and differ by 1 cent at most.
 *
 * @example splitCents(10000, 3) // [{ amountCents: 3334, count: 1 }, { amountCents: 3333, count: 2 }]
 * @example splitCents(12000, 30) // [{ amountCents: 400, count: 30 }]
 * @returns The groups of identical shares, largest share first (1 group when it divides evenly)
 */
export function splitCents(totalCents: number, people: number): ShareGroup[] {
  const quotient = Math.floor(totalCents / people);
  const remainder = totalCents % people;

  if (remainder === 0) {
    return [{ amountCents: quotient, count: people }];
  }

  return [
    { amountCents: quotient + 1, count: remainder }, // these people pay 1 extra cent
    { amountCents: quotient, count: people - remainder },
  ];
}

/**
 * Describes the shares in French.
 * @example describeShares(10000, 3) // "1 × 33,34 € + 2 × 33,33 €"
 * @example describeShares(12000, 30) // "4,00 € par personne"
 */
export function describeShares(totalCents: number, people: number): string {
  const groups = splitCents(totalCents, people);

  if (groups.length === 1) {
    return `${formatCents(groups[0].amountCents)} par personne`;
  }

  return groups.map((group) => `${group.count} × ${formatCents(group.amountCents)}`).join(" + ");
}
