import type { Expense } from "../types/expense";
import { formatDate } from "../utils/date";
import { formatCents } from "../utils/money";

interface ExpenseListProps {
  expenses: Expense[];
  /** Called when the user clicks "Modifier" on a row. */
  onEdit: (expense: Expense) => void;
  /** Called when the user checks / unchecks the "Validée" box of a row. */
  onToggleValidated: (expense: Expense) => void;
  /** Called when the user confirms the deletion of an expense. */
  onDelete: (id: number) => void;
}

/**
 * Table of every expense, most recent first, with a "Validée" checkbox and
 * edit / delete buttons per row.
 */
function ExpenseList({ expenses, onEdit, onToggleValidated, onDelete }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <section className="card bg-base-100 shadow">
        <div className="card-body text-center text-base-content/60">
          Aucune dépense enregistrée pour le moment.
        </div>
      </section>
    );
  }

  function handleDelete(expense: Expense) {
    // Deleting cannot be undone: ask for confirmation first
    if (window.confirm(`Supprimer la dépense « ${expense.label} » ?`)) {
      onDelete(expense.id);
    }
  }

  return (
    <section className="card bg-base-100 shadow">
      <div className="card-body">
        <h2 className="card-title">Dépenses</h2>
        {/* overflow-x-auto: on a narrow phone screen the table scrolls instead of overflowing */}
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
                <tr key={expense.id}>
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
                  </td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-success checkbox-sm"
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
                      onClick={() => handleDelete(expense)}
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
  );
}

export default ExpenseList;
