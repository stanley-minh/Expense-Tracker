<?php

/**
 * Database configuration constants (same names as in the course).
 *
 * Values come from the root .env file, injected into the PHP container
 * by Docker Compose (env_file). No secret is ever written in the code.
 */

define('BDD_HOST', getenv('DB_HOST'));
define('BDD_NAME', getenv('DB_NAME'));
define('BDD_USERNAME', getenv('DB_USER'));
define('BDD_PASSWORD', getenv('DB_PASSWORD'));

// Code the church gives to its accountants so they can create an account.
// Empty or missing = registrations closed (AuthController::register answers 403).
define('REGISTRATION_CODE', (string) getenv('REGISTRATION_CODE'));
