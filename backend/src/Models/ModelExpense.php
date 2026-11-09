<?php

namespace App\Models;

/**
 * Data access for the "expenses" table.
 */
final class ModelExpense extends Model
{
    /**
     * Returns every expense, most recent first.
     *
     * Columns are listed explicitly (no SELECT *): a column added later
     * can never be sent to the frontend by accident.
     *
     * @return array<int, array{id: int, label: string, amount_cents: int, spent_at: string}>
     */
    public function findAll(): array
    {
        $req = $this->getBdd()->prepare(
            'SELECT id, label, amount_cents, spent_at FROM expenses ORDER BY spent_at DESC'
        );
        $req->execute();

        return $req->fetchAll();
    }
}
