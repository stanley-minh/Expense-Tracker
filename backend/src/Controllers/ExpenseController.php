<?php

namespace App\Controllers;

use App\Core\Auth;
use App\Core\HttpException;
use App\Core\Request;
use App\Core\Response;
use App\Models\ModelCategory;
use App\Models\ModelExpense;
use App\Validators\ExpenseValidator;

/**
 * Handles the /api/expenses routes (full CRUD + validation).
 *
 * Every route requires a logged-in user (401 otherwise) and only works on
 * that user's own expenses: another user's expense answers 404.
 *
 * HTTP status codes used:
 *   200 OK                    read / update succeeded
 *   201 Created               resource created (+ Location header)
 *   204 No Content            resource deleted (empty body)
 *   400 Bad Request           body is not a valid JSON object
 *   404 Not Found             id does not exist
 *   422 Unprocessable Content valid JSON, but invalid values
 */
final class ExpenseController extends Controller
{
    /** Second model: needed to check that the category sent by the client exists. */
    private ModelCategory $categories;

    public function __construct()
    {
        parent::__construct(new ModelExpense());
        $this->categories = new ModelCategory();
    }

    /**
     * GET /api/expenses — lists every expense of the logged-in user.
     */
    public function index(): void
    {
        $userId = Auth::requireUserId();

        Response::json($this->getModel()->findAll($userId));
    }

    /**
     * GET /api/expenses/{id} — returns one expense.
     *
     * @param int $id Expense id (from the URL)
     */
    public function show(int $id): void
    {
        $userId = Auth::requireUserId();
        $expense = $this->getModel()->findById($id, $userId);

        if ($expense === null) {
            Response::json(['error' => 'Dépense introuvable.'], 404);
            return;
        }

        Response::json($expense);
    }

    /**
     * POST /api/expenses — creates an expense.
     * Body: {"label": "...", "category_id": 1, "category_detail": null, "amount_cents": 1234,
     *        "participants_count": 1, "spent_at": "YYYY-MM-DD"}
     * participants_count is optional (default 1 = not shared).
     * category_detail is only required (and only kept) for the "other" (Autre) category.
     */
    public function store(): void
    {
        $userId = Auth::requireUserId();

        $data = $this->readValidBody();
        if ($data === null) {
            return; // error response already sent
        }

        $id = $this->getModel()->create($data, $userId);

        // 201 + Location: tells the client where the new resource lives
        Response::json(
            $this->getModel()->findById($id, $userId),
            201,
            ['Location' => '/api/expenses/' . $id]
        );
    }

    /**
     * PUT /api/expenses/{id} — replaces an expense (every field is required).
     *
     * @param int $id Expense id (from the URL)
     */
    public function update(int $id): void
    {
        $userId = Auth::requireUserId();

        // 404 first: no need to validate a body for a resource that does not exist
        if ($this->getModel()->findById($id, $userId) === null) {
            Response::json(['error' => 'Dépense introuvable.'], 404);
            return;
        }

        $data = $this->readValidBody();
        if ($data === null) {
            return;
        }

        $this->getModel()->update($id, $userId, $data);

        Response::json($this->getModel()->findById($id, $userId));
    }

    /**
     * PATCH /api/expenses/{id}/validation — checks or unchecks "validated".
     * Body: {"is_validated": true}
     *
     * PATCH (not PUT): only ONE field of the expense changes, the others stay as they are.
     *
     * @param int $id Expense id (from the URL)
     */
    public function validate(int $id): void
    {
        $userId = Auth::requireUserId();

        if ($this->getModel()->findById($id, $userId) === null) {
            Response::json(['error' => 'Dépense introuvable.'], 404);
            return;
        }

        $body = Request::json();
        if ($body === null) {
            throw new HttpException(400, 'Le corps de la requête doit être un objet JSON.');
        }

        // is_bool: only true / false are accepted (not 1, "true", "oui"...)
        if (!is_bool($body['is_validated'] ?? null)) {
            Response::json(['errors' => ['is_validated' => 'La valeur doit être true ou false.']], 422);
            return;
        }

        $this->getModel()->setValidated($id, $userId, $body['is_validated']);

        Response::json($this->getModel()->findById($id, $userId));
    }

    /**
     * DELETE /api/expenses/{id} — deletes an expense.
     *
     * @param int $id Expense id (from the URL)
     */
    public function destroy(int $id): void
    {
        $userId = Auth::requireUserId();

        if (!$this->getModel()->delete($id, $userId)) {
            Response::json(['error' => 'Dépense introuvable.'], 404);
            return;
        }

        Response::noContent();
    }

    /**
     * Reads and validates the JSON body shared by store() and update().
     * Sends the 400 / 422 error response itself when something is wrong.
     *
     * @return array{label: string, category_id: int, category_detail: ?string, amount_cents: int, participants_count: int, spent_at: string}|null
     *         Clean data, or null if an error response was sent
     */
    private function readValidBody(): ?array
    {
        $body = Request::json();
        if ($body === null) {
            Response::json(['error' => 'Le corps de la requête doit être un objet JSON.'], 400);
            return null;
        }

        $categorySlugs = $this->categories->findSlugsById();

        $errors = ExpenseValidator::validate($body, $categorySlugs);
        if ($errors !== []) {
            Response::json(['errors' => $errors], 422);
            return null;
        }

        return ExpenseValidator::clean($body, $categorySlugs);
    }
}
