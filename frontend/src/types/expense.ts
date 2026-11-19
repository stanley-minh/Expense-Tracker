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
  /** Number of people the expense is shared between (1 = not shared). */
  participants_count: number;
  /** Date in "YYYY-MM-DD" format. */
  spent_at: string;
  /** Checked by the accountant once the expense has been analyzed. */
  is_validated: boolean;
  /** When it was validated ("YYYY-MM-DD HH:MM:SS"), null when not validated. */
  validated_at: string | null;
}

/** Body sent to POST /api/expenses and PUT /api/expenses/{id}. */
export interface ExpenseInput {
  label: string;
  category_id: number;
  category_detail: string | null;
  amount_cents: number;
  participants_count: number;
  spent_at: string;
}

/** One error message per invalid field, as returned with a 422 response. */
export type ValidationErrors = Partial<Record<keyof ExpenseInput, string>>;
