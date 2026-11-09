<?php

/**
 * Minimal PSR-4 autoloader (no Composer).
 *
 * Convention: namespace = folder path.
 *   App\Core\Router  ->  src/Core/Router.php
 *
 * PHP calls this function the first time it meets an unknown class,
 * so each file is only loaded when it is actually used.
 *
 * Warning: macOS ignores filename case by default, Linux does not.
 * Always match the namespace case exactly, or it breaks in production.
 */

spl_autoload_register(function (string $class): void {
    $prefix  = 'App\\';             // root namespace of the project
    $baseDir = __DIR__ . '/../';    // = backend/src/

    // Ignore classes that do not belong to the project
    if (strncmp($class, $prefix, strlen($prefix)) !== 0) {
        return;
    }

    // "App\Core\Router" -> "Core\Router" -> "Core/Router.php"
    $relative = substr($class, strlen($prefix));
    $file     = $baseDir . str_replace('\\', '/', $relative) . '.php';

    if (is_file($file)) {
        require $file;
    }
});
