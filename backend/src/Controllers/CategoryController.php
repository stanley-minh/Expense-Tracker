<?php

namespace App\Controllers;

use App\Core\Response;
use App\Models\ModelCategory;

/**
 * Handles the /api/categories routes (read only: categories are reference data).
 */
final class CategoryController extends Controller
{
    public function __construct()
    {
        parent::__construct(new ModelCategory());
    }

    /**
     * GET /api/categories — lists every category (used to fill the form's select).
     */
    public function index(): void
    {
        Response::json($this->getModel()->findAll());
    }
}
