import { useState } from "react";
import type { Expense } from "../types/expense";
import { formatDate } from "../utils/date";
import { describeShares, formatCents } from "../utils/money";
import ConfirmDialog from "./ConfirmDialog";

interface ExpenseListProps {
  expenses: Expense[];
  /** Called when the user clicks "Modifier" on a row. */
  onEdit: (expense: Expense) => void;
  /** Called when the user checks / unchecks the "Validée" box of a row. */
  onToggleValidated: (expense: Expense) => void;
  /** Called when the user confirms the deletion of an expense. */
  onDelete: (expense: Expense) => void;
}

/**
 * Every expense, most recent first, with a "Validée" checkbox and edit / delete buttons.
 *
 * @remarks
 * Responsive: the same data is rendered twice, and CSS shows only one version.
 * - Phone (below md = 768px): one card per expense, readable without horizontal scrolling.
 * - Tablet and desktop (md and up): a table, easier to compare amounts in a column.
 * Touch targets are at least 44px high on phones (min-h-11), the WCAG recommendation
 * for fingers.
 */
function ExpenseList({ expenses, onEdit, onToggleValidated, onDelete }: ExpenseListProps) {
  /** Expense waiting for the user's confirmation in the dialog (null = no dialog). */
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  if (expenses.length === 0) {
    return (
      <section className="card bg-base-100 shadow">
        <div className="card-body items-center text-center text-base-content/60">
          <p>Aucune dépense à afficher.</p>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Phone: cards */}
      <ul className="space-y-3 md:hidden" aria-label="Dépenses">
        {expenses.map((expense) => (
          <li key={expense.id} className="card bg-base-100 shadow-sm">
            <div className="card-body gap-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {/* break-words: a very long label wraps instead of overflowing the card */}
                  <p className="font-semibold break-words">{expense.label}</p>
                  <p className="text-sm text-base-content/60">
                    {expense.category_name}
                    {expense.category_detail && ` — ${expense.category_detail}`} ·{" "}
                    {formatDate(expense.spent_at)}
                  </p>
                </div>
                <p className="text-lg font-semibold whitespace-nowrap tabular-nums">
                  {formatCents(expense.amount_cents)}
                </p>
              </div>

              {expense.participants_count > 1 && (
                <p className="text-sm text-base-content/70">
                  {expense.participants_count} pers. :{" "}
                  {describeShares(expense.amount_cents, expense.participants_count)}
                </p>
              )}

              <div className="flex items-center justify-between gap-2">
                {/* The whole label is clickable: a 44px target instead of the small box alone */}
                <label className="flex min-h-11 cursor-pointer items-center gap-3 pr-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-success"
                    checked={expense.is_validated}
                    onChange={() => onToggleValidated(expense)}
                  />
                  <span className="text-sm">Validée</span>
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="btn btn-ghost min-h-11"
                    onClick={() => onEdit(expense)}
                    aria-label={`Modifier ${expense.label}`}
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost min-h-11 text-error"
                    onClick={() => setExpenseToDelete(expense)}
                    aria-label={`Supprimer ${expense.label}`}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Tablet and desktop: table */}
      <section className="card hidden bg-base-100 shadow md:block">
        <div className="card-body">
          <h2 className="card-title">Dépenses</h2>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Libellé</th>
                  <th>Catégorie</th>
                  <th className="text-right">Montant</th>
                  <th className="text-center">Validée</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-base-200/50">
                    <td className="whitespace-nowrap">{formatDate(expense.spent_at)}</td>
                    <td>{expense.label}</td>
                    <td>
                      {expense.category_name}
                      {expense.category_detail && (
                        <span className="text-base-content/60"> — {expense.category_detail}</span>
                      )}
                    </td>
                    {/* tabular-nums: every digit has the same width, so amounts line up */}
                    <td className="text-right whitespace-nowrap tabular-nums">
                      {formatCents(expense.amount_cents)}
                      {expense.participants_count > 1 && (
                        <span className="block text-xs text-base-content/60">
                          {expense.participants_count} pers. :{" "}
                          {describeShares(expense.amount_cents, expense.participants_count)}
                        </span>
                      )}
                    </td>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-success"
                        checked={expense.is_validated}
                        onChange={() => onToggleValidated(expense)}
                        aria-label={`Dépense « ${expense.label} » validée`}
                      />
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => onEdit(expense)}
                        aria-label={`Modifier ${expense.label}`}
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm text-error"
                        onClick={() => setExpenseToDelete(expense)}
                        aria-label={`Supprimer ${expense.label}`}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Deleting cannot be undone: ask for confirmation first.
          key: a fresh dialog (opened by its useEffect) for each expense */}
      {expenseToDelete && (
        <ConfirmDialog
          key={expenseToDelete.id}
          title="Supprimer cette dépense ?"
          message={`« ${expenseToDelete.label} » (${formatCents(expenseToDelete.amount_cents)}) sera supprimée définitivement.`}
          confirmLabel="Supprimer"
          onConfirm={() => onDelete(expenseToDelete)}
          onClose={() => setExpenseToDelete(null)}
        />
      )}
    </>
  );
}

export default ExpenseList;
