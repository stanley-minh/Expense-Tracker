import { useState } from "react";
import { createExpense, ValidationError } from "../api/client";
import type { Category, Expense, ValidationErrors } from "../types/expense";
import { todayIso } from "../utils/date";
import { parseEurosToCents } from "../utils/money";

interface ExpenseFormProps {
  /** Categories for the select, loaded by the parent page. */
  categories: Category[];
  /** Called with the expense returned by the API once it has been created. */
  onCreated: (expense: Expense) => void;
}

/**
 * Form to add an expense.
 *
 * @remarks
 * Controlled form: every field is stored in a state variable.
 * The "Précisez" field only appears when the "other" category is selected.
 * Errors returned by the API (422) are displayed under the matching field.
 * The amount is typed in euros ("12,50") and sent in cents (1250).
 */
function ExpenseForm({ categories, onCreated }: ExpenseFormProps) {
  const [label, setLabel] = useState("");
  /** Value of the select: a string ("" = nothing chosen yet), converted to a number on submit. */
  const [categoryId, setCategoryId] = useState("");
  const [categoryDetail, setCategoryDetail] = useState("");
  /** Amount as typed by the user, in euros ("12,50"). */
  const [amount, setAmount] = useState("");
  const [spentAt, setSpentAt] = useState(todayIso());

  /** Field errors (from the API or from the local amount check). */
  const [errors, setErrors] = useState<ValidationErrors>({});
  /** General error (e.g. server unreachable). */
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // The "other" category is detected by its slug, never by its id or its name
  const selectedCategory = categories.find((category) => category.id === Number(categoryId));
  const isOther = selectedCategory?.slug === "other";

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError(null);

    // Local check of the amount: the API expects cents, so the text must be convertible
    const amountCents = parseEurosToCents(amount);
    if (amountCents === null) {
      setErrors({ amount_cents: "Montant invalide (exemple : 12,50)." });
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createExpense({
        label,
        category_id: Number(categoryId), // "" becomes 0: the API answers "Choisissez une catégorie"
        category_detail: isOther ? categoryDetail : null,
        amount_cents: amountCents,
        spent_at: spentAt,
      });

      onCreated(created);

      // Reset the fields that change for each expense; keep category and date,
      // which are often the same when several receipts are entered in a row
      setLabel("");
      setAmount("");
      setCategoryDetail("");
    } catch (error) {
      if (error instanceof ValidationError) {
        setErrors(error.errors); // 422: one message per field
      } else {
        console.error(error);
        setFormError("Impossible d'enregistrer la dépense. Réessayez plus tard.");
      }
    } finally {
      // Runs in every case: the button can never stay disabled
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card bg-base-100 shadow" noValidate>
      <div className="card-body">
        <h2 className="card-title">Nouvelle dépense</h2>

        <fieldset className="fieldset">
          <label className="fieldset-legend" htmlFor="expense-label">
            Libellé
          </label>
          <input
            id="expense-label"
            type="text"
            className={`input w-full ${errors.label ? "input-error" : ""}`}
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            maxLength={255}
            aria-invalid={errors.label !== undefined}
          />
          {errors.label && <p className="label text-error">{errors.label}</p>}
        </fieldset>

        <fieldset className="fieldset">
          <label className="fieldset-legend" htmlFor="expense-category">
            Catégorie
          </label>
          <select
            id="expense-category"
            className={`select w-full ${errors.category_id ? "select-error" : ""}`}
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            aria-invalid={errors.category_id !== undefined}
          >
            <option value="" disabled>
              Choisir une catégorie
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.category_id && <p className="label text-error">{errors.category_id}</p>}
        </fieldset>

        {isOther && (
          <fieldset className="fieldset">
            <label className="fieldset-legend" htmlFor="expense-category-detail">
              Précisez la catégorie
            </label>
            <input
              id="expense-category-detail"
              type="text"
              className={`input w-full ${errors.category_detail ? "input-error" : ""}`}
              value={categoryDetail}
              onChange={(event) => setCategoryDetail(event.target.value)}
              maxLength={100}
              placeholder="Exemple : Décoration"
              aria-invalid={errors.category_detail !== undefined}
            />
            {errors.category_detail && <p className="label text-error">{errors.category_detail}</p>}
          </fieldset>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <fieldset className="fieldset">
            <label className="fieldset-legend" htmlFor="expense-amount">
              Montant (€)
            </label>
            {/* type="text" + inputMode="decimal": numeric keyboard on mobile, and the
                French comma is accepted (type="number" handles it differently per browser) */}
            <input
              id="expense-amount"
              type="text"
              inputMode="decimal"
              className={`input w-full ${errors.amount_cents ? "input-error" : ""}`}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="12,50"
              aria-invalid={errors.amount_cents !== undefined}
            />
            {errors.amount_cents && <p className="label text-error">{errors.amount_cents}</p>}
          </fieldset>

          <fieldset className="fieldset">
            <label className="fieldset-legend" htmlFor="expense-date">
              Date
            </label>
            <input
              id="expense-date"
              type="date"
              className={`input w-full ${errors.spent_at ? "input-error" : ""}`}
              value={spentAt}
              onChange={(event) => setSpentAt(event.target.value)}
              aria-invalid={errors.spent_at !== undefined}
            />
            {errors.spent_at && <p className="label text-error">{errors.spent_at}</p>}
          </fieldset>
        </div>

        {formError && (
          <div role="alert" className="alert alert-error">
            {formError}
          </div>
        )}

        <div className="card-actions justify-end">
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement..." : "Ajouter la dépense"}
          </button>
        </div>
      </div>
    </form>
  );
}

export default ExpenseForm;
