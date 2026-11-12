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

use App\Controllers\AccountController;
use App\Controllers\AuthController;
use App\Controllers\CategoryController;
use App\Controllers\ExpenseController;
use App\Core\HttpException;
use App\Core\Response;
use App\Core\Router;

$router = new Router();

// --- Routes ---
// Authentication (public)
$router->post('/api/auth/register', [AuthController::class, 'register']);
$router->post('/api/auth/login', [AuthController::class, 'login']);
$router->post('/api/auth/logout', [AuthController::class, 'logout']);
$router->get('/api/auth/me', [AuthController::class, 'me']);

// Account of the logged-in user
$router->put('/api/account', [AccountController::class, 'update']);
$router->delete('/api/account', [AccountController::class, 'destroy']);

// Expenses of the logged-in user
$router->get('/api/expenses', [ExpenseController::class, 'index']);
$router->get('/api/expenses/{id}', [ExpenseController::class, 'show']);
$router->post('/api/expenses', [ExpenseController::class, 'store']);
$router->put('/api/expenses/{id}', [ExpenseController::class, 'update']);
$router->delete('/api/expenses/{id}', [ExpenseController::class, 'destroy']);
$router->patch('/api/expenses/{id}/validation', [ExpenseController::class, 'validate']);

// Reference data (public)

$router->get('/api/categories', [CategoryController::class, 'index']);

// --- Execution ---
try {
    $router->dispatch($_SERVER['REQUEST_METHOD'], $_SERVER['REQUEST_URI']);
} catch (HttpException $e) {
    // Expected error (401 not logged in, 403 forbidden...): its message is meant for the user
    Response::json(['error' => $e->getMessage()], $e->getStatus());
} catch (Throwable $e) {
    // The real error goes to the server logs (docker compose logs php)...
    error_log((string) $e);
    // ...but the client never sees internal details (SQL, paths, credentials)
    Response::json(['error' => 'Erreur interne du serveur.'], 500);
}
