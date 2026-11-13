import { useEffect, useState } from "react";
import { deleteExpense, getCategories, getExpenses, setExpenseValidated } from "../api/client";
import type { Category, Expense } from "../types/expense";

/**
 * Sort order of the lists: most recent date first, then most recently created
 * (same order as the API: ORDER BY spent_at DESC, id DESC).
 * "YYYY-MM-DD" strings sort correctly as text: year, then month, then day.
 */
function byMostRecent(a: Expense, b: Expense): number {
  return b.spent_at.localeCompare(a.spent_at) || b.id - a.id;
}

/**
 * Custom hook: loads the logged-in user's expenses + the categories, and gives
 * the functions that keep the list up to date after each change.
 *
 * @remarks
 * Used by the "Saisie" page AND the "Récapitulatif" page: the loading logic is
 * written once instead of being copied into both pages. A custom hook is just
 * a function whose name starts with "use" and that calls other hooks.
 */
export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  function addExpense(expense: Expense) {
    // Functional update (prev => ...): always based on the latest state
    setExpenses((prev) => [expense, ...prev].sort(byMostRecent));
  }

  /** Replaces an expense by the version returned by the API (after an edit). */
  function replaceExpense(updated: Expense) {
    // Sorted again because the date may have changed
    setExpenses((prev) =>
      prev.map((expense) => (expense.id === updated.id ? updated : expense)).sort(byMostRecent),
    );
  }

  /** Checks / unchecks "validated" on the server, then shows the row returned by the API. */
  async function toggleValidated(expense: Expense) {
    try {
      const updated = await setExpenseValidated(expense.id, !expense.is_validated);
      setExpenses((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (toggleError) {
      console.error(toggleError);
      setError("Impossible de modifier la validation. Réessayez plus tard.");
    }
  }

  /** Deletes on the server first, then removes the row from the screen. */
  async function removeExpense(id: number) {
    try {
      await deleteExpense(id);
      setExpenses((prev) => prev.filter((expense) => expense.id !== id));
    } catch (deleteError) {
      console.error(deleteError);
      setError("Impossible de supprimer la dépense. Réessayez plus tard.");
    }
  }

  return {
    expenses,
    categories,
    isLoading,
    error,
    addExpense,
    replaceExpense,
    toggleValidated,
    removeExpense,
  };
}
