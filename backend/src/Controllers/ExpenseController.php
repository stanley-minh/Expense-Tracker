<?php

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Models\ModelCategory;
use App\Models\ModelExpense;
use App\Validators\ExpenseValidator;

/**
 * Handles the /api/expenses routes (full CRUD).
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
     * GET /api/expenses — lists every expense.
     */
    public function index(): void
    {
        Response::json($this->getModel()->findAll());
    }

    /**
     * GET /api/expenses/{id} — returns one expense.
     *
     * @param int $id Expense id (from the URL)
     */
    public function show(int $id): void
    {
        $expense = $this->getModel()->findById($id);

        if ($expense === null) {
            Response::json(['error' => 'Dépense introuvable.'], 404);
            return;
        }

        Response::json($expense);
    }

    /**
     * POST /api/expenses — creates an expense.
     * Body: {"label": "...", "category_id": 1, "category_detail": null, "amount_cents": 1234, "spent_at": "YYYY-MM-DD"}
     * category_detail is only required (and only kept) for the "other" (Autre) category.
     */
    public function store(): void
    {
        $data = $this->readValidBody();
        if ($data === null) {
            return; // error response already sent
        }

        $id = $this->getModel()->create($data);

        // 201 + Location: tells the client where the new resource lives
        Response::json(
            $this->getModel()->findById($id),
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
        // 404 first: no need to validate a body for a resource that does not exist
        if ($this->getModel()->findById($id) === null) {
            Response::json(['error' => 'Dépense introuvable.'], 404);
            return;
        }

        $data = $this->readValidBody();
        if ($data === null) {
            return;
        }

        $this->getModel()->update($id, $data);

        Response::json($this->getModel()->findById($id));
    }

    /**
     * DELETE /api/expenses/{id} — deletes an expense.
     *
     * @param int $id Expense id (from the URL)
     */
    public function destroy(int $id): void
    {
        if (!$this->getModel()->delete($id)) {
            Response::json(['error' => 'Dépense introuvable.'], 404);
            return;
        }

        Response::noContent();
    }

    /**
     * Reads and validates the JSON body shared by store() and update().
     * Sends the 400 / 422 error response itself when something is wrong.
     *
     * @return array{label: string, category_id: int, category_detail: ?string, amount_cents: int, spent_at: string}|null
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
