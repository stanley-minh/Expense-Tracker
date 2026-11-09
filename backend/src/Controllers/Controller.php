<?php

namespace App\Controllers;

use App\Models\Model;

/**
 * Parent of every Controller: stores the associated Model.
 *
 * There is no View class here: with a React frontend, the "View"
 * is the JSON response sent by App\Core\Response.
 */
abstract class Controller
{
    /** Model used by the controller to read/write data. */
    private Model $model;

    /**
     * @param Model $model Model associated with this controller
     */
    public function __construct(Model $model)
    {
        $this->model = $model;
    }

    /**
     * @return Model The associated Model
     */
    public function getModel(): Model
    {
        return $this->model;
    }
}
