import type { Expense } from "../types/expense";
import { currentMonthLabel, monthOf, todayIso } from "../utils/date";
import { formatCents } from "../utils/money";

interface MonthSummaryProps {
  /** Every expense: the component keeps only those of the current month. */
  expenses: Expense[];
}

/**
 * Current month's total, then the total of each category, largest first.
 */
function MonthSummary({ expenses }: MonthSummaryProps) {
  const currentMonth = monthOf(todayIso());
  const monthExpenses = expenses.filter((expense) => monthOf(expense.spent_at) === currentMonth);

  // Sum of every amount: reduce starts at 0 and adds each amount (integers: exact)
  const total = monthExpenses.reduce((sum, expense) => sum + expense.amount_cents, 0);

  // Same sum, restricted to the validated expenses
  const validatedExpenses = monthExpenses.filter((expense) => expense.is_validated);
  const validatedTotal = validatedExpenses.reduce((sum, expense) => sum + expense.amount_cents, 0);

  // Totals per category name: { "Agape": 4250, "Hygiène": 1890, ... }
  const totalsByCategory = monthExpenses.reduce<Record<string, number>>((totals, expense) => {
    const name = expense.category_name;
    totals[name] = (totals[name] ?? 0) + expense.amount_cents;
    return totals;
  }, {});

  // [name, total] pairs, sorted from the largest total to the smallest
  const sortedTotals = Object.entries(totalsByCategory).sort((a, b) => b[1] - a[1]);

  return (
    <section className="card bg-base-100 shadow">
      <div className="card-body">
        <div>
          <p className="text-sm text-base-content/60">Total de {currentMonthLabel()}</p>
          <p className="text-4xl font-bold text-primary tabular-nums">{formatCents(total)}</p>
          <p className="text-sm text-base-content/60">
            {monthExpenses.length} dépense{monthExpenses.length > 1 ? "s" : ""}, dont{" "}
            {validatedExpenses.length} validée{validatedExpenses.length > 1 ? "s" : ""} (
            {formatCents(validatedTotal)})
          </p>
        </div>

        {sortedTotals.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {sortedTotals.map(([name, categoryTotal]) => (
              <li key={name} className="badge badge-outline badge-lg gap-2">
                {name}
                <span className="font-semibold">{formatCents(categoryTotal)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default MonthSummary;
