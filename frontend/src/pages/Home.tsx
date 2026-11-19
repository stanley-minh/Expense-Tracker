import ExpenseForm from "../components/ExpenseForm";
import MonthSummary from "../components/MonthSummary";
import RecentExpenses from "../components/RecentExpenses";
import { useExpenses } from "../hooks/useExpenses";
import { useToast } from "../toast/useToast";
import type { Expense } from "../types/expense";

/**
 * "Saisie" page: month summary, form to enter an expense, last entries.
 * Validation, editing and deletion happen on the "Récapitulatif" page.
 * Code is written in English, but every text shown to users is in French.
 */
function Home() {
  const { expenses, categories, isLoading, error, addExpense } = useExpenses();
  const { showToast } = useToast();

  function handleSaved(expense: Expense) {
    addExpense(expense);
    // Same confirmation style as on the "Récapitulatif" page; the new expense also
    // appears right away in "Dernières saisies", which links to the full table
    showToast(`« ${expense.label} » a été enregistrée.`);
  }

  return (
    <main className="p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-2xl font-bold md:text-3xl">Saisie des dépenses</h1>

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
            <ExpenseForm categories={categories} onSaved={handleSaved} />
            <RecentExpenses expenses={expenses} />
          </>
        )}
      </div>
    </main>
  );
}

export default Home;
