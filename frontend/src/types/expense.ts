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
  /** Date in "YYYY-MM-DD" format. */
  spent_at: string;
}

/** Body sent to POST /api/expenses and PUT /api/expenses/{id}. */
export interface ExpenseInput {
  label: string;
  category_id: number;
  category_detail: string | null;
  amount_cents: number;
  spent_at: string;
}

/** One error message per invalid field, as returned with a 422 response. */
export type ValidationErrors = Partial<Record<keyof ExpenseInput, string>>;
