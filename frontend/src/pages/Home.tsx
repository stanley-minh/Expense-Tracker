import { useEffect, useState } from "react";
import { deleteExpense, getCategories, getExpenses, setExpenseValidated } from "../api/client";
import ExpenseEditDialog from "../components/ExpenseEditDialog";
import ExpenseForm from "../components/ExpenseForm";
import ExpenseList from "../components/ExpenseList";
import MonthSummary from "../components/MonthSummary";
import type { Category, Expense } from "../types/expense";

/**
 * Sort order of the list: most recent date first, then most recently created
 * (same order as the API: ORDER BY spent_at DESC, id DESC).
 * "YYYY-MM-DD" strings sort correctly as text: year, then month, then day.
 */
function byMostRecent(a: Expense, b: Expense): number {
  return b.spent_at.localeCompare(a.spent_at) || b.id - a.id;
}

/**
 * Home page: month summary, add form and list of the logged-in user's expenses.
 *
 * @remarks
 * This page owns the data (expenses + categories) and passes it down to the
 * components through props; the components report changes back through
 * callbacks (onSaved, onEdit, onToggleValidated, onDelete). Data flows down, events flow up.
 * Code is written in English, but every text shown to users is in French.
 */
function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Expense currently being edited in the dialog, or null when the dialog is closed. */
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Initial load, once when the page appears ([] = no dependency)
  useEffect(() => {
    // AbortController: cancels the requests if the page disappears before they end
    // (in development, StrictMode mounts the page twice on purpose to reveal such bugs)
    const controller = new AbortController();

    // Promise.all: both requests run in parallel, not one after the other
    Promise.all([getExpenses(controller.signal), getCategories(controller.signal)])
      .then(([loadedExpenses, loadedCategories]) => {
        setExpenses(loadedExpenses);
        setCategories(loadedCategories);
      })
      .catch((loadError) => {
        if (controller.signal.aborted) return; // cancelled on purpose: not an error
        // 401 (session expired): the AuthProvider already sends the user to /login
        console.error(loadError);
        setError("Impossible de charger les dépenses. Le serveur est-il démarré ?");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    // Cleanup function: React calls it when the page is removed
    return () => controller.abort();
  }, []);

  /** Adds the expense returned by the API, without reloading the whole list. */
  function handleCreated(expense: Expense) {
    // Functional update (prev => ...): always based on the latest state
    setExpenses((prev) => [expense, ...prev].sort(byMostRecent));
  }

  /** Replaces the edited expense in the list, then closes the dialog. */
  function handleUpdated(updated: Expense) {
    // map: same list, except the row with the same id, which is replaced.
    // Sorted again because the date may have changed.
    setExpenses((prev) =>
      prev.map((expense) => (expense.id === updated.id ? updated : expense)).sort(byMostRecent),
    );
    setEditingExpense(null);
  }

  /** Checks / unchecks "validated" on the server, then shows the row returned by the API. */
  async function handleToggleValidated(expense: Expense) {
    try {
      const updated = await setExpenseValidated(expense.id, !expense.is_validated);
      setExpenses((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (toggleError) {
      console.error(toggleError);
      setError("Impossible de modifier la validation. Réessayez plus tard.");
    }
  }

  /** Deletes on the server first, then removes the row from the screen. */
  async function handleDelete(id: number) {
    try {
      await deleteExpense(id);
      setExpenses((prev) => prev.filter((expense) => expense.id !== id));
    } catch (deleteError) {
      console.error(deleteError);
      setError("Impossible de supprimer la dépense. Réessayez plus tard.");
    }
  }

  return (
    <main className="p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-3xl font-bold">Mes dépenses</h1>

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
            <MonthSummary expenses={expenses} />
            <ExpenseForm categories={categories} onSaved={handleCreated} />
            <ExpenseList
              expenses={expenses}
              onEdit={setEditingExpense}
              onToggleValidated={handleToggleValidated}
              onDelete={handleDelete}
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

export default Home;
