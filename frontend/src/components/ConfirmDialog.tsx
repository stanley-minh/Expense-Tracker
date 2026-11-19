import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  /** Question shown as the title, e.g. "Supprimer cette dépense ?". */
  title: string;
  /** Extra explanation under the title. */
  message: string;
  /** Text of the confirm button, e.g. "Supprimer". */
  confirmLabel: string;
  /** Called when the user confirms. The dialog closes afterwards. */
  onConfirm: () => void;
  /** Called for every other way of closing: "Annuler", Escape, backdrop click. */
  onClose: () => void;
}

/**
 * Confirmation dialog for an action that cannot be undone (replaces window.confirm).
 *
 * @remarks
 * Same technique as ExpenseEditDialog: the native <dialog> element opened with
 * showModal() gives the backdrop, the focus trap and the Escape key for free.
 * Unlike window.confirm, it follows the app's theme and works the same in every browser.
 * The focus starts on "Annuler" (autoFocus): pressing Enter by reflex does NOT delete.
 */
function ConfirmDialog({ title, message, confirmLabel, onConfirm, onClose }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  function handleConfirm() {
    onConfirm();
    dialogRef.current?.close(); // triggers onClose, which unmounts the dialog
  }

  return (
    <dialog ref={dialogRef} className="modal modal-bottom sm:modal-middle" onClose={onClose}>
      <div className="modal-box">
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="py-4">{message}</p>
        <div className="modal-action">
          <button
            type="button"
            className="btn"
            onClick={() => dialogRef.current?.close()}
            autoFocus
          >
            Annuler
          </button>
          <button type="button" className="btn btn-error" onClick={handleConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">Fermer</button>
      </form>
    </dialog>
  );
}

export default ConfirmDialog;
