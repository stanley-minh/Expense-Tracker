import { useId, useState } from "react";
import { createExpense, updateExpense, ValidationError } from "../api/client";
import type { Category, Expense, ExpenseInput, ValidationErrors } from "../types/expense";
import { todayIso } from "../utils/date";
import { centsToInputValue, describeShares, parseEurosToCents } from "../utils/money";

interface ExpenseFormProps {
  /** Categories for the select, loaded by the parent page. */
  categories: Category[];
  /** Expense to edit. When absent, the form creates a new expense. */
  expense?: Expense;
  /** Called with the expense returned by the API once it has been created or updated. */
  onSaved: (expense: Expense) => void;
  /** When given, a "Cancel" button is shown (used by the edit dialog). */
  onCancel?: () => void;
}

/**
 * Turns the text of the "Participants" field into a list of names.
 * Accepts one name per line AND/OR names separated by commas; blank entries are dropped.
 * Duplicates are kept on purpose: the API rejects them with a clear message.
 * @example parseNames("Marie D., Paul\n  Léa \n") // ["Marie D.", "Paul", "Léa"]
 */
function parseNames(text: string): string[] {
  return text
    .split(/[\n,]/) // regular expression: a line break OR a comma
    .map((name) => name.trim())
    .filter((name) => name !== "");
}

/**
 * Form to add OR edit an expense (same fields, same validation).
 *
 * @remarks
 * Controlled form: every field is stored in a state variable.
 * - Create mode (no `expense` prop): POST, then the fields are emptied.
 * - Edit mode (`expense` prop given): fields start with the expense's values, PUT on submit.
 * The "Précisez" field only appears when the "other" category is selected.
 * The "Participants" field only exists in create mode; afterwards participants are
 * managed in ParticipantsDialog (to keep their "paid" status).
 * Errors returned by the API (422) are displayed under the matching field.
 * The amount is typed in euros ("12,50") and sent in cents (1250).
 */
function ExpenseForm({ categories, expense, onSaved, onCancel }: ExpenseFormProps) {
  const isEditing = expense !== undefined;

  // Initial values: the expense's values in edit mode, empty fields in create mode.
  // useState only uses its argument on the FIRST render, which is what we want here.
  const [label, setLabel] = useState(expense?.label ?? "");
  /** Value of the select: a string ("" = nothing chosen yet), converted to a number on submit. */
  const [categoryId, setCategoryId] = useState(expense ? String(expense.category_id) : "");
  const [categoryDetail, setCategoryDetail] = useState(expense?.category_detail ?? "");
  /** Amount as typed by the user, in euros ("12,50"). */
  const [amount, setAmount] = useState(expense ? centsToInputValue(expense.amount_cents) : "");
  const [spentAt, setSpentAt] = useState(expense?.spent_at ?? todayIso());
  /** Participants as typed, one per line or separated by commas (create mode only). */
  const [participantsText, setParticipantsText] = useState("");

  /** Field errors (from the API or from the local amount check). */
  const [errors, setErrors] = useState<ValidationErrors>({});
  /** General error (e.g. server unreachable). */
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Unique prefix for the ids: the page can show two forms at once (add + edit dialog),
  // and two elements with the same id would break the label <-> input links
  const idPrefix = useId();

  // The "other" category is detected by its slug, never by its id or its name
  const selectedCategory = categories.find((category) => category.id === Number(categoryId));
  const isOther = selectedCategory?.slug === "other";

  // Live preview of the split, computed at each render from the current inputs.
  // Shown only when the amount is valid and there is more than 1 person.
  // Create mode: the names typed in the field. Edit mode: participants are managed
  // in their own dialog, but the preview still shows the new shares if the amount changes.
  const names = parseNames(participantsText);
  const previewCents = parseEurosToCents(amount);
  const previewPeople = isEditing ? expense.participants.length : names.length;
  const sharePreview =
    previewCents !== null && previewPeople > 1 ? describeShares(previewCents, previewPeople) : null;

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

    const input: ExpenseInput = {
      label,
      category_id: Number(categoryId), // "" becomes 0: the API answers "Choisissez une catégorie"
      category_detail: isOther ? categoryDetail : null,
      amount_cents: amountCents,
      spent_at: spentAt,
      // Only sent on creation: PUT ignores participants (they have their own routes)
      ...(isEditing ? {} : { participants: names }),
    };

    setIsSubmitting(true);
    try {
      const saved = isEditing ? await updateExpense(expense.id, input) : await createExpense(input);

      onSaved(saved);

      if (!isEditing) {
        // Reset the fields that change for each expense; keep category and date,
        // which are often the same when several receipts are entered in a row
        setLabel("");
        setAmount("");
        setCategoryDetail("");
        setParticipantsText("");
      }
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
        <h2 className="card-title">{isEditing ? "Modifier la dépense" : "Nouvelle dépense"}</h2>

        <fieldset className="fieldset">
          <label className="fieldset-legend" htmlFor={`${idPrefix}-label`}>
            Libellé
          </label>
          <input
            id={`${idPrefix}-label`}
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
          <label className="fieldset-legend" htmlFor={`${idPrefix}-category`}>
            Catégorie
          </label>
          <select
            id={`${idPrefix}-category`}
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
            <label className="fieldset-legend" htmlFor={`${idPrefix}-category-detail`}>
              Précisez la catégorie
            </label>
            <input
              id={`${idPrefix}-category-detail`}
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
            <label className="fieldset-legend" htmlFor={`${idPrefix}-amount`}>
              Montant (€)
            </label>
            {/* type="text" + inputMode="decimal": numeric keyboard on mobile, and the
                French comma is accepted (type="number" handles it differently per browser) */}
            <input
              id={`${idPrefix}-amount`}
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
            <label className="fieldset-legend" htmlFor={`${idPrefix}-date`}>
              Date
            </label>
            <input
              id={`${idPrefix}-date`}
              type="date"
              className={`input w-full ${errors.spent_at ? "input-error" : ""}`}
              value={spentAt}
              onChange={(event) => setSpentAt(event.target.value)}
              aria-invalid={errors.spent_at !== undefined}
            />
            {errors.spent_at && <p className="label text-error">{errors.spent_at}</p>}
          </fieldset>
        </div>

        {isEditing ? (
          // Edit mode: participants keep their "paid" status, so they are not retyped here
          expense.participants.length > 0 && (
            <p className="text-sm text-base-content/70" aria-live="polite">
              Partagée entre {expense.participants.length} personnes
              {sharePreview && ` : ${sharePreview}`}. Les participants se gèrent avec le bouton «
              Participants ».
            </p>
          )
        ) : (
          <fieldset className="fieldset">
            <label className="fieldset-legend" htmlFor={`${idPrefix}-participants`}>
              Participants (facultatif)
            </label>
            <textarea
              id={`${idPrefix}-participants`}
              className={`textarea w-full ${errors.participants ? "textarea-error" : ""}`}
              rows={3}
              value={participantsText}
              onChange={(event) => setParticipantsText(event.target.value)}
              placeholder={
                "Un prénom par ligne, ou séparés par des virgules\nExemple : Marie D., Paul"
              }
              aria-invalid={errors.participants !== undefined}
              aria-describedby={`${idPrefix}-participants-hint`}
            />
            {errors.participants ? (
              <p className="label text-error">{errors.participants}</p>
            ) : (
              <p id={`${idPrefix}-participants-hint`} className="label" aria-live="polite">
                {sharePreview
                  ? `${names.length} personnes : ${sharePreview}`
                  : "Laissez vide si la dépense n'est pas partagée. Prénom et initiale suffisent."}
              </p>
            )}
          </fieldset>
        )}

        {formError && (
          <div role="alert" className="alert alert-error">
            {formError}
          </div>
        )}

        <div className="card-actions justify-end">
          {onCancel && (
            <button type="button" className="btn btn-ghost" onClick={onCancel}>
              Annuler
            </button>
          )}
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting
              ? "Enregistrement..."
              : isEditing
                ? "Enregistrer les modifications"
                : "Ajouter la dépense"}
          </button>
        </div>
      </div>
    </form>
  );
}

export default ExpenseForm;
