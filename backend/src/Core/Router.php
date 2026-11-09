<?php

namespace App\Core;

/**
 * Maps an HTTP method + a path to a controller action.
 *
 * Limitation (for now): only exact paths are supported.
 * Routes with parameters (/api/expenses/{id}) come with the full CRUD step.
 */
final class Router
{
    /**
     * Registered routes, indexed by HTTP method then by path.
     *
     * @var array<string, array<string, array{0: class-string, 1: string}>>
     */
    private array $routes = [];

    /**
     * Registers a GET route.
     *
     * @param string                          $path    Exact path, e.g. "/api/expenses"
     * @param array{0: class-string, 1: string} $handler [ControllerClass::class, 'method']
     */
    public function get(string $path, array $handler): void
    {
        $this->routes['GET'][$path] = $handler;
    }

    /**
     * Registers a POST route.
     *
     * @param string                          $path    Exact path
     * @param array{0: class-string, 1: string} $handler [ControllerClass::class, 'method']
     */
    public function post(string $path, array $handler): void
    {
        $this->routes['POST'][$path] = $handler;
    }

    /**
     * Finds the route matching the request and runs its controller action.
     * Sends a 404 JSON response when no route matches.
     *
     * @param string $method HTTP method of the request (GET, POST...)
     * @param string $uri    Full request URI, query string included
     */
    public function dispatch(string $method, string $uri): void
    {
        $path    = parse_url($uri, PHP_URL_PATH);
        $handler = $this->routes[$method][$path] ?? null;

        if ($handler === null) {
            Response::json(['error' => 'Not found'], 404);
            return;
        }

        [$class, $action] = $handler;   // array destructuring
        (new $class())->$action();      // e.g. (new ExpenseController())->index()
    }
}
