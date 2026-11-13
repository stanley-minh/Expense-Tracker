<?php

namespace App\Core;

/**
 * Maps an HTTP method + a path pattern to a controller action.
 *
 * Paths may contain numeric parameters written {name}:
 *   /api/expenses/{id}  matches  /api/expenses/42  ->  action receives $id = 42
 *
 * Each pattern is turned into a regular expression once, when the route is
 * registered. Dispatching then tests the request path against each regex.
 */
final class Router
{
    /**
     * Registered routes, in declaration order.
     *
     * @var list<array{method: string, regex: string, handler: array{0: class-string, 1: string}}>
     */
    private array $routes = [];

    /**
     * Registers a GET route (read).
     *
     * @param string                            $path    Path pattern, e.g. "/api/expenses/{id}"
     * @param array{0: class-string, 1: string} $handler [ControllerClass::class, 'method']
     */
    public function get(string $path, array $handler): void
    {
        $this->add('GET', $path, $handler);
    }

    /**
     * Registers a POST route (create).
     *
     * @param string                            $path    Path pattern
     * @param array{0: class-string, 1: string} $handler [ControllerClass::class, 'method']
     */
    public function post(string $path, array $handler): void
    {
        $this->add('POST', $path, $handler);
    }

    /**
     * Registers a PUT route (full update).
     *
     * @param string                            $path    Path pattern
     * @param array{0: class-string, 1: string} $handler [ControllerClass::class, 'method']
     */
    public function put(string $path, array $handler): void
    {
        $this->add('PUT', $path, $handler);
    }

    /**
     * Registers a PATCH route (partial update: only some fields change).
     *
     * @param string                            $path    Path pattern
     * @param array{0: class-string, 1: string} $handler [ControllerClass::class, 'method']
     */
    public function patch(string $path, array $handler): void
    {
        $this->add('PATCH', $path, $handler);
    }

    /**
     * Registers a DELETE route.
     *
     * @param string                            $path    Path pattern
     * @param array{0: class-string, 1: string} $handler [ControllerClass::class, 'method']
     */
    public function delete(string $path, array $handler): void
    {
        $this->add('DELETE', $path, $handler);
    }

    /**
     * Stores a route after converting its path pattern into a regex.
     *
     * "/api/expenses/{id}"  ->  "#^/api/expenses/(?P<id>\d+)$#"
     *   - ^ and $       : the WHOLE path must match (not just a part of it)
     *   - (?P<id>\d+)   : named group "id" made of one or more digits
     *
     * @param string                            $method  HTTP method
     * @param string                            $path    Path pattern
     * @param array{0: class-string, 1: string} $handler Controller action
     */
    private function add(string $method, string $path, array $handler): void
    {
        $regex = preg_replace('#\{(\w+)\}#', '(?P<$1>\d+)', $path);

        $this->routes[] = [
            'method'  => $method,
            'regex'   => '#^' . $regex . '$#',
            'handler' => $handler,
        ];
    }

    /**
     * Finds the route matching the request and runs its controller action.
     *
     * - path + method match   -> runs the action with the URL parameters
     * - path matches only     -> 405 Method Not Allowed (+ Allow header)
     * - nothing matches       -> 404 Not Found
     *
     * @param string $method HTTP method of the request (GET, POST...)
     * @param string $uri    Full request URI, query string included
     */
    public function dispatch(string $method, string $uri): void
    {
        $path           = parse_url($uri, PHP_URL_PATH);
        $allowedMethods = [];

        foreach ($this->routes as $route) {
            if (!preg_match($route['regex'], $path, $matches)) {
                continue; // path does not match: try the next route
            }

            if ($route['method'] !== $method) {
                $allowedMethods[] = $route['method']; // right path, wrong method
                continue;
            }

            // Keep only the named groups ("id" => "42"), drop numeric keys (0, 1...)
            // and convert to int: patterns only accept digits.
            $params = array_map('intval', array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY));

            [$class, $action] = $route['handler'];
            (new $class())->$action(...$params); // named arguments: show(id: 42)
            return;
        }

        if ($allowedMethods !== []) {
            header('Allow: ' . implode(', ', $allowedMethods));
            Response::json(['error' => 'Méthode non autorisée.'], 405);
            return;
        }

        Response::json(['error' => 'Ressource introuvable.'], 404);
    }
}
