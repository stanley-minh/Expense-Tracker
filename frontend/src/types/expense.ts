/**
 * Types shared by the whole frontend.
 * They mirror the JSON returned by the PHP API (snake_case keys, amounts in cents).
 */

/** A category, as returned by GET /api/categories. */
export interface Category {
  id: number;
  /** Stable technical code ("agape", "other"...): use it in the code, never the id or the name. */
  slug: string;
  /** Label shown to users ("Agape", "Autre"...). */
  name: string;
}

/** A person who shares an expense, as returned inside an Expense. */
export interface Participant {
  id: number;
  /** First name (+ initial), e.g. "Marie D.". */
  name: string;
  /** Checked by the accountant once the person has paid their share. */
  has_paid: boolean;
  /** When the payment was checked ("YYYY-MM-DD HH:MM:SS"), null when not paid. */
  paid_at: string | null;
  /**
   * This person's share in cents, COMPUTED by the API (never stored): the amount
   * split between the participants to the exact cent. Every share changes when the
   * amount or the list of participants changes.
   */
  share_cents: number;
}

/** An expense, as returned by GET/POST/PUT /api/expenses. */
export interface Expense {
  id: number;
  label: string;
  category_id: number;
  category_slug: string;
  category_name: string;
  /** Free text, only filled for the "other" category. */
  category_detail: string | null;
  /** Integer amount in cents (4250 = 42,50 €). */
  amount_cents: number;
  /** Date in "YYYY-MM-DD" format. */
  spent_at: string;
  /** Checked by the accountant once the expense has been analyzed. */
  is_validated: boolean;
  /** When it was validated ("YYYY-MM-DD HH:MM:SS"), null when not validated. */
  validated_at: string | null;
  /** People who share the expense, in a stable order. Empty = not shared. */
  participants: Participant[];
}

/** Body sent to POST /api/expenses and PUT /api/expenses/{id}. */
export interface ExpenseInput {
  label: string;
  category_id: number;
  category_detail: string | null;
  amount_cents: number;
  spent_at: string;
  /**
   * Names of the people who share the expense. Only read by POST (creation);
   * afterwards, participants have their own routes (/participants).
   */
  participants?: string[];
}

/** One error message per invalid field, as returned with a 422 response. */
export type ValidationErrors = Partial<Record<keyof ExpenseInput, string>>;
