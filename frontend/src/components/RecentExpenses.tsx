import { Link } from "react-router";
import type { Expense } from "../types/expense";
import { formatDate } from "../utils/date";
import { formatCents } from "../utils/money";

interface RecentExpensesProps {
  expenses: Expense[];
  /** How many expenses to show. */
  limit?: number;
}

/**
 * Short read-only list of the last entered expenses, on the "Saisie" page.
 * The full table (with validation, edit and delete) is on the "Récapitulatif" page.
 */
function RecentExpenses({ expenses, limit = 5 }: RecentExpensesProps) {
  // expenses is already sorted (most recent first): slice keeps the first ones
  const recent = expenses.slice(0, limit);

  return (
    <section className="card bg-base-100 shadow">
      <div className="card-body">
        <div className="flex items-center justify-between gap-2">
          <h2 className="card-title">Dernières saisies</h2>
          <Link to="/recap" className="link link-primary text-sm">
            Voir le récapitulatif
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="text-base-content/60">Aucune dépense enregistrée pour le moment.</p>
        ) : (
          <ul className="divide-y divide-base-200">
            {recent.map((expense) => (
              <li key={expense.id} className="flex items-center justify-between gap-4 py-2">
                <span>
                  <span className="text-sm text-base-content/60">
                    {formatDate(expense.spent_at)}
                  </span>{" "}
                  {expense.label}
                </span>
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <span className="tabular-nums">{formatCents(expense.amount_cents)}</span>
                  {expense.is_validated ? (
                    <span className="badge badge-success badge-sm">Validée</span>
                  ) : (
                    <span className="badge badge-ghost badge-sm">À valider</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default RecentExpenses;
