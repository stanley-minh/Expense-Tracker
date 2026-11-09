<?php

namespace App\Controllers;

use App\Core\Response;
use App\Models\ModelExpense;

/**
 * Handles the /api/expenses routes.
 */
final class ExpenseController extends Controller
{
    public function __construct()
    {
        parent::__construct(new ModelExpense());
    }

    /**
     * GET /api/expenses — lists every expense.
     */
    public function index(): void
    {
        Response::json($this->getModel()->findAll());
    }
}
