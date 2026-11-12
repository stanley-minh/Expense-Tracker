import { useEffect, useRef } from "react";
import type { Category, Expense } from "../types/expense";
import ExpenseForm from "./ExpenseForm";

interface ExpenseEditDialogProps {
  /** Expense being edited. */
  expense: Expense;
  categories: Category[];
  /** Called with the updated expense returned by the API. */
  onSaved: (expense: Expense) => void;
  /** Called when the dialog closes without saving (Escape, backdrop click, "Annuler"). */
  onClose: () => void;
}

/**
 * Modal dialog containing the expense form in edit mode.
 *
 * @remarks
 * Uses the native HTML <dialog> element: once opened with showModal(), the browser
 * handles the dark backdrop, keeps keyboard focus inside the dialog and closes it
 * with the Escape key (accessibility for free). daisyUI only adds the styling.
 */
function ExpenseEditDialog({ expense, categories, onSaved, onClose }: ExpenseEditDialogProps) {
  // useRef: gives access to the real DOM <dialog> element to call its showModal() method
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Open the dialog as soon as the component is displayed
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    // onClose fires for every way of closing: Escape, backdrop click, close() call
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box p-0">
        <ExpenseForm
          expense={expense}
          categories={categories}
          onSaved={onSaved}
          onCancel={() => dialogRef.current?.close()}
        />
      </div>
      {/* Clicking outside the box closes the dialog: method="dialog" closes without sending anything */}
      <form method="dialog" className="modal-backdrop">
        <button type="submit">Fermer</button>
      </form>
    </dialog>
  );
}

export default ExpenseEditDialog;
