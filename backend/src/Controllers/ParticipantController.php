<?php

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Request;
use App\Core\Response;
use App\Models\ModelExpense;
use App\Models\ModelParticipant;
use App\Validators\ParticipantValidator;
use PDOException;

/**
 * Handles the participants of a shared expense:
 *   POST   /api/expenses/{id}/participants                          add a person
 *   PATCH  /api/expenses/{id}/participants/{participantId}/payment  paid / not paid
 *   DELETE /api/expenses/{id}/participants/{participantId}          remove a person
 *
 * Every route answers with the WHOLE updated expense (200, or 201 for POST), not
 * just the participant: adding or removing someone changes everyone's share, so the
 * client needs every share again. It simply replaces the expense in its list.
 *
 * Every route requires a logged-in user and only works on that user's own
 * expenses: another user's expense or participant answers 404.
 */
final class ParticipantController extends Controller
{
    /** Second model: to return the updated expense (with recomputed shares). */
    private ModelExpense $expenses;

    public function __construct()
    {
        parent::__construct(new ModelParticipant());
        $this->expenses = new ModelExpense();
    }

    /**
     * POST /api/expenses/{id}/participants — adds a person to the expense.
     * Body: {"name": "Marie D."}
     *
     * @param int $id Expense id (from the URL)
     */
    public function store(int $id): void
    {
        $userId = Auth::requireUserId();

        if ($this->expenses->findById($id, $userId) === null) {
            Response::json(['error' => 'Dépense introuvable.'], 404);
            return;
        }

        $body = Request::json();
        if ($body === null) {
            Response::json(['error' => 'Le corps de la requête doit être un objet JSON.'], 400);
            return;
        }

        $error = ParticipantValidator::validateName($body['name'] ?? null);
        if ($error !== null) {
            Response::json(['errors' => ['name' => $error]], 422);
            return;
        }

        if ($this->getModel()->countForExpense($id) >= ParticipantValidator::MAX_PARTICIPANTS) {
            Response::json(['errors' => ['name' => 'Une dépense ne peut pas être partagée entre plus de '
                . ParticipantValidator::MAX_PARTICIPANTS . ' personnes.']], 422);
            return;
        }

        try {
            $this->getModel()->add($id, $userId, trim($body['name']));
        } catch (PDOException $e) {
            // 1062 = duplicate entry on UNIQUE (expense_id, name). Relying on the
            // constraint (instead of a SELECT before the INSERT) is also safe when two
            // requests arrive at the same time: only one INSERT can win.
            if (($e->errorInfo[1] ?? null) === 1062) {
                Response::json(['errors' => ['name' => 'Cette personne est déjà dans la liste.']], 422);
                return;
            }
            throw $e;
        }

        Response::json($this->expenses->findById($id, $userId), 201);
    }

    /**
     * PATCH /api/expenses/{id}/participants/{participantId}/payment — paid or not.
     * Body: {"has_paid": true}
     *
     * @param int $id            Expense id (from the URL)
     * @param int $participantId Participant id (from the URL)
     */
    public function payment(int $id, int $participantId): void
    {
        $userId = Auth::requireUserId();

        if (!$this->getModel()->exists($participantId, $id, $userId)) {
            Response::json(['error' => 'Participant introuvable.'], 404);
            return;
        }

        $body = Request::json();
        if ($body === null) {
            Response::json(['error' => 'Le corps de la requête doit être un objet JSON.'], 400);
            return;
        }

        // is_bool: only true / false are accepted (not 1, "true", "oui"...)
        if (!is_bool($body['has_paid'] ?? null)) {
            Response::json(['errors' => ['has_paid' => 'La valeur doit être true ou false.']], 422);
            return;
        }

        $this->getModel()->setPaid($participantId, $id, $userId, $body['has_paid']);

        Response::json($this->expenses->findById($id, $userId));
    }

    /**
     * DELETE /api/expenses/{id}/participants/{participantId} — removes a person.
     * Answers 200 with the expense (not 204): the remaining shares have changed.
     *
     * @param int $id            Expense id (from the URL)
     * @param int $participantId Participant id (from the URL)
     */
    public function destroy(int $id, int $participantId): void
    {
        $userId = Auth::requireUserId();

        if (!$this->getModel()->delete($participantId, $id, $userId)) {
            Response::json(['error' => 'Participant introuvable.'], 404);
            return;
        }

        Response::json($this->expenses->findById($id, $userId));
    }
}
