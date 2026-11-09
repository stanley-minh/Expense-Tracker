<?php

/**
 * Front controller: the single entry point of the API.
 *
 * Every HTTP request is routed here by nginx (see docker/nginx/default.conf).
 * This file holds no business logic: it loads, declares the routes, then delegates.
 */

declare(strict_types=1); // PHP refuses implicit type conversions

require __DIR__ . '/../src/Core/Autoloader.php';
require __DIR__ . '/../config/env.php'; // BDD_* constants (must exist before Utils::connect)

use App\Controllers\ExpenseController;
use App\Core\Response;
use App\Core\Router;

$router = new Router();

// --- Routes ---
$router->get('/api/expenses', [ExpenseController::class, 'index']);
$router->get('/api/expenses/{id}', [ExpenseController::class, 'show']);
$router->post('/api/expenses', [ExpenseController::class, 'store']);
$router->put('/api/expenses/{id}', [ExpenseController::class, 'update']);
$router->delete('/api/expenses/{id}', [ExpenseController::class, 'destroy']);

// --- Execution ---
try {
    $router->dispatch($_SERVER['REQUEST_METHOD'], $_SERVER['REQUEST_URI']);
} catch (Throwable $e) {
    // The real error goes to the server logs (docker compose logs php)...
    error_log((string) $e);
    // ...but the client never sees internal details (SQL, paths, credentials)
    Response::json(['error' => 'Internal server error'], 500);
}
