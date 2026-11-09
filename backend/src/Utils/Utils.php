<?php

namespace App\Utils;

use PDO;

/**
 * Shared helpers (same role as Utils in the course).
 */
class Utils
{
    /**
     * Shared PDO connection: created once per HTTP request (Singleton),
     * no matter how many Models use it.
     */
    private static ?PDO $pdo = null;

    /**
     * Returns the PDO connection to MySQL, creating it on the first call.
     *
     * @return PDO
     * @throws \PDOException When the database is unreachable or credentials are wrong
     */
    public static function connect(): PDO
    {
        if (self::$pdo === null) {
            // Port as a separate parameter + utf8mb4 (full UTF-8: accents, emojis...)
            $dsn = 'mysql:host=' . BDD_HOST . ';port=3306;dbname=' . BDD_NAME . ';charset=utf8mb4';

            self::$pdo = new PDO($dsn, BDD_USERNAME, BDD_PASSWORD, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // SQL errors become exceptions
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // rows as key => value arrays
                PDO::ATTR_EMULATE_PREPARES   => false,                  // real prepared statements (anti SQL injection)
            ]);
        }

        return self::$pdo;
    }
}
