import { useState } from "react";
import { useSearchParams } from "react-router";
import ExpenseEditDialog from "../components/ExpenseEditDialog";
import ExpenseList from "../components/ExpenseList";
import { useExpenses } from "../hooks/useExpenses";
import type { Expense } from "../types/expense";
import { formatCents } from "../utils/money";

/** The three views of the table; the value is stored in the URL (?statut=...). */
const FILTERS = [
  { value: "toutes", label: "Toutes" },
  { value: "a-valider", label: "À valider" },
  { value: "validees", label: "Validées" },
] as const;

/** "toutes" | "a-valider" | "validees", derived from the array above. */
type Filter = (typeof FILTERS)[number]["value"];

/**
 * "Récapitulatif" page: table of every saved expense, where the accountant checks
 * the validated ones, edits or deletes them.
 *
 * @remarks
 * The selected filter is kept in the URL (/recap?statut=a-valider) instead of a
 * state variable: it survives a page reload and the link can be bookmarked.
 */
function Recap() {
  const { expenses, categories, isLoading, error, replaceExpense, toggleValidated, removeExpense } =
    useExpenses();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Unknown or missing value in the URL: fall back to "toutes"
  const requested = searchParams.get("statut");
  const filter: Filter = FILTERS.some((item) => item.value === requested)
    ? (requested as Filter)
    : "toutes";

  // Counts for the tab labels, computed on every expense
  const toValidateCount = expenses.filter((expense) => !expense.is_validated).length;
  const counts: Record<Filter, number> = {
    toutes: expenses.length,
    "a-valider": toValidateCount,
    validees: expenses.length - toValidateCount,
  };

  const visibleExpenses = expenses.filter((expense) => {
    if (filter === "a-valider") return !expense.is_validated;
    if (filter === "validees") return expense.is_validated;
    return true;
  });
  const visibleTotal = visibleExpenses.reduce((sum, expense) => sum + expense.amount_cents, 0);

  function handleUpdated(updated: Expense) {
    replaceExpense(updated);
    setEditingExpense(null);
  }

  return (
    <main className="p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-3xl font-bold">Récapitulatif</h1>
        <p className="text-base-content/70">
          Cochez « Validée » une fois la dépense analysée. La case peut être décochée à tout moment.
        </p>

        {error && (
          <div role="alert" className="alert alert-error">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" aria-label="Chargement" />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Tabs: links that change ?statut= in the URL */}
              <div role="tablist" className="tabs tabs-box">
                {FILTERS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    role="tab"
                    aria-selected={filter === item.value}
                    className={`tab ${filter === item.value ? "tab-active" : ""}`}
                    onClick={() => setSearchParams({ statut: item.value })}
                  >
                    {item.label} ({counts[item.value]})
                  </button>
                ))}
              </div>
              <p className="text-sm">
                Total affiché :{" "}
                <span className="font-semibold tabular-nums">{formatCents(visibleTotal)}</span>
              </p>
            </div>

            <ExpenseList
              expenses={visibleExpenses}
              onEdit={setEditingExpense}
              onToggleValidated={toggleValidated}
              onDelete={removeExpense}
            />
          </>
        )}
      </div>

      {/* key: a new dialog (with fresh fields) for each edited expense */}
      {editingExpense && (
        <ExpenseEditDialog
          key={editingExpense.id}
          expense={editingExpense}
          categories={categories}
          onSaved={handleUpdated}
          onClose={() => setEditingExpense(null)}
        />
      )}
    </main>
  );
}

export default Recap;
