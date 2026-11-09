<?php

namespace App\Models;

use App\Utils\Utils;
use PDO;

/**
 * Parent of every Model: gives access to the database.
 *
 * Abstract: it is never instantiated directly, only through its children
 * (ModelExpense...). Private attribute + getter, as in the course.
 */
abstract class Model
{
    /** Database connection shared by the child Models. */
    private PDO $bdd;

    public function __construct()
    {
        $this->bdd = Utils::connect();
    }

    /**
     * @return PDO The database connection
     */
    public function getBdd(): PDO
    {
        return $this->bdd;
    }
}
