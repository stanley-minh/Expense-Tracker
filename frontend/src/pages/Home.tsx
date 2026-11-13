import { useState } from "react";
import { Link } from "react-router";
import ExpenseForm from "../components/ExpenseForm";
import MonthSummary from "../components/MonthSummary";
import RecentExpenses from "../components/RecentExpenses";
import { useExpenses } from "../hooks/useExpenses";
import type { Expense } from "../types/expense";

/**
 * "Saisie" page: month summary, form to enter an expense, last entries.
 * Validation, editing and deletion happen on the "Récapitulatif" page.
 * Code is written in English, but every text shown to users is in French.
 */
function Home() {
  const { expenses, categories, isLoading, error, addExpense } = useExpenses();
  /** Label of the last saved expense, for the confirmation message. */
  const [lastSavedLabel, setLastSavedLabel] = useState<string | null>(null);

  function handleSaved(expense: Expense) {
    addExpense(expense);
    setLastSavedLabel(expense.label);
  }

  return (
    <main className="p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-3xl font-bold">Saisie des dépenses</h1>

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

            {lastSavedLabel && (
              // role="status": screen readers announce the message without interrupting
              <div role="status" className="alert alert-success">
                <span>
                  « {lastSavedLabel} » a été enregistrée.{" "}
                  <Link to="/recap" className="link font-semibold">
                    Voir le récapitulatif
                  </Link>
                </span>
              </div>
            )}

            <ExpenseForm categories={categories} onSaved={handleSaved} />
            <RecentExpenses expenses={expenses} />
          </>
        )}
      </div>
    </main>
  );
}

export default Home;
