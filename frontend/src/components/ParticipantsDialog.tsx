import { useEffect, useId, useRef, useState } from "react";
import {
  addParticipant,
  removeParticipant,
  setParticipantPaid,
  ValidationError,
} from "../api/client";
import type { Expense, Participant } from "../types/expense";
import { formatCents } from "../utils/money";

interface ParticipantsDialogProps {
  /** Expense whose participants are managed. Always the latest version from the parent. */
  expense: Expense;
  /** Called with the updated expense returned by the API after every change. */
  onChanged: (expense: Expense) => void;
  /** Called when the dialog closes (Escape, backdrop click, "Fermer"). */
  onClose: () => void;
}

/**
 * Dialog to manage who shares an expense and who has paid their share.
 *
 * @remarks
 * - Every change is sent to the API right away; the API answers with the whole
 *   expense (shares recomputed), which the parent puts back in its list.
 * - The shares are displayed, never computed here: the API is the single source
 *   of truth for the split (Euclidean division, to the exact cent).
 * - Same <dialog> technique as ExpenseEditDialog (focus trap, Escape for free).
 */
function ParticipantsDialog({ expense, onChanged, onClose }: ParticipantsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputId = useId();

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** true while a request runs: buttons are disabled to avoid double clicks. */
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const participants = expense.participants;
  const paidCents = participants
    .filter((participant) => participant.has_paid)
    .reduce((sum, participant) => sum + participant.share_cents, 0);
  const outstandingCents = participants.reduce((sum, p) => sum + p.share_cents, 0) - paidCents;

  /**
   * Runs one API call with the shared busy / error handling.
   * @returns true when the call succeeded
   */
  async function run(call: () => Promise<Expense>): Promise<boolean> {
    setIsBusy(true);
    setError(null);
    setNameError(null);
    try {
      onChanged(await call());
      return true;
    } catch (callError) {
      if (callError instanceof ValidationError) {
        setNameError(callError.errors.name ?? "Valeur invalide.");
      } else {
        console.error(callError);
        setError("Impossible d'enregistrer la modification. Réessayez plus tard.");
      }
      return false;
    } finally {
      setIsBusy(false);
    }
  }

  async function handleAdd(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await run(() => addParticipant(expense.id, name))) {
      setName(""); // ready for the next name
    }
  }

  function handleTogglePaid(participant: Participant) {
    void run(() => setParticipantPaid(expense.id, participant.id, !participant.has_paid));
  }

  function handleRemove(participant: Participant) {
    void run(() => removeParticipant(expense.id, participant.id));
  }

  return (
    <dialog ref={dialogRef} className="modal modal-bottom sm:modal-middle" onClose={onClose}>
      <div className="modal-box">
        <h3 className="text-lg font-bold">Participants</h3>
        <p className="text-sm text-base-content/70">
          {expense.label} · {formatCents(expense.amount_cents)}
        </p>

        {participants.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <span className="badge badge-success badge-soft">
              Encaissé {formatCents(paidCents)}
            </span>
            <span className="badge badge-warning badge-soft">
              Reste {formatCents(outstandingCents)}
            </span>
          </div>
        )}

        {error && (
          <div role="alert" className="alert alert-error mt-3">
            {error}
          </div>
        )}

        {participants.length === 0 ? (
          <p className="py-4 text-base-content/60">
            Personne pour l'instant. Ajoutez les personnes qui partagent cette dépense.
          </p>
        ) : (
          <ul className="divide-y divide-base-200 py-2">
            {participants.map((participant) => (
              <li key={participant.id} className="flex items-center justify-between gap-2 py-1">
                {/* Whole label clickable: 44px touch target */}
                <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-success"
                    checked={participant.has_paid}
                    onChange={() => handleTogglePaid(participant)}
                    disabled={isBusy}
                  />
                  <span className={participant.has_paid ? "text-base-content/60" : ""}>
                    {participant.name}
                  </span>
                </label>
                <span className="tabular-nums whitespace-nowrap">
                  {formatCents(participant.share_cents)}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-square min-h-11 text-error"
                  onClick={() => handleRemove(participant)}
                  disabled={isBusy}
                  aria-label={`Retirer ${participant.name}`}
                  title="Retirer"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAdd} className="fieldset" noValidate>
          <label className="fieldset-legend" htmlFor={inputId}>
            Ajouter une personne
          </label>
          <div className="join w-full">
            <input
              id={inputId}
              type="text"
              className={`input join-item w-full ${nameError ? "input-error" : ""}`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
              placeholder="Prénom et initiale, ex. : Marie D."
              aria-invalid={nameError !== null}
              autoComplete="off"
            />
            <button type="submit" className="btn btn-primary join-item" disabled={isBusy}>
              Ajouter
            </button>
          </div>
          {nameError && <p className="label text-error">{nameError}</p>}
        </form>

        <div className="modal-action">
          <button type="button" className="btn" onClick={() => dialogRef.current?.close()}>
            Fermer
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">Fermer</button>
      </form>
    </dialog>
  );
}

export default ParticipantsDialog;
