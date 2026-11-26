<?php

namespace App\Models;

use PDO;

/**
 * Data access for the "expense_participants" table (add, mark as paid, remove).
 * Reading is done by ModelExpense: participants are always returned inside their expense.
 *
 * SECURITY: expense_participants has no user_id column. Every query therefore
 * JOINs the parent expense and checks expenses.user_id: without it, any logged-in
 * user could change the participants of another church's expense just by changing
 * the ids in the URL (IDOR: Insecure Direct Object Reference).
 */
final class ModelParticipant extends Model
{
    /**
     * Adds a participant to an expense of the user.
     *
     * INSERT ... SELECT: the row is inserted only if the SELECT finds the expense
     * for this user. Owner check and insertion happen in ONE query.
     *
     * @return bool true if added, false if the expense does not exist for this user
     * @throws \PDOException SQLSTATE 23000 when the name is already on this expense (UNIQUE)
     */
    public function add(int $expenseId, int $userId, string $name): bool
    {
        $req = $this->getBdd()->prepare(
            'INSERT INTO expense_participants (expense_id, name)
             SELECT e.id, :name FROM expenses e WHERE e.id = :expense_id AND e.user_id = :user_id'
        );
        $req->bindValue(':name', $name);
        $req->bindValue(':expense_id', $expenseId, PDO::PARAM_INT);
        $req->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $req->execute();

        return $req->rowCount() > 0;
    }

    /**
     * Counts the participants of an expense (to enforce the maximum before adding one).
     */
    public function countForExpense(int $expenseId): int
    {
        $req = $this->getBdd()->prepare(
            'SELECT COUNT(*) FROM expense_participants WHERE expense_id = :expense_id'
        );
        $req->bindValue(':expense_id', $expenseId, PDO::PARAM_INT);
        $req->execute();

        return (int) $req->fetchColumn();
    }

    /**
     * Tells whether a participant exists on this expense of this user.
     * Needed before setPaid(): rowCount() returns 0 when the value does not change,
     * so an UPDATE alone cannot tell "not found" from "already in that state".
     */
    public function exists(int $participantId, int $expenseId, int $userId): bool
    {
        $req = $this->getBdd()->prepare(
            'SELECT 1 FROM expense_participants p
             INNER JOIN expenses e ON e.id = p.expense_id
             WHERE p.id = :id AND p.expense_id = :expense_id AND e.user_id = :user_id'
        );
        $req->bindValue(':id', $participantId, PDO::PARAM_INT);
        $req->bindValue(':expense_id', $expenseId, PDO::PARAM_INT);
        $req->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $req->execute();

        return $req->fetchColumn() !== false;
    }

    /**
     * Marks a participant's share as paid (with the current date) or not paid.
     * UPDATE with a JOIN: the owner check is part of the same query.
     */
    public function setPaid(int $participantId, int $expenseId, int $userId, bool $hasPaid): void
    {
        $req = $this->getBdd()->prepare(
            'UPDATE expense_participants p
             INNER JOIN expenses e ON e.id = p.expense_id
             SET p.has_paid = :has_paid,
                 p.paid_at = IF(:has_paid_again, NOW(), NULL)
             WHERE p.id = :id AND p.expense_id = :expense_id AND e.user_id = :user_id'
        );
        $req->bindValue(':has_paid', $hasPaid, PDO::PARAM_BOOL);
        $req->bindValue(':has_paid_again', $hasPaid, PDO::PARAM_BOOL);
        $req->bindValue(':id', $participantId, PDO::PARAM_INT);
        $req->bindValue(':expense_id', $expenseId, PDO::PARAM_INT);
        $req->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $req->execute();
    }

    /**
     * Removes a participant. The other shares are recomputed automatically on the
     * next read, since shares are never stored.
     *
     * @return bool true if deleted, false if not found (or not this user's expense)
     */
    public function delete(int $participantId, int $expenseId, int $userId): bool
    {
        // Multi-table DELETE syntax: "DELETE p FROM ..." deletes only from p (the participants)
        $req = $this->getBdd()->prepare(
            'DELETE p FROM expense_participants p
             INNER JOIN expenses e ON e.id = p.expense_id
             WHERE p.id = :id AND p.expense_id = :expense_id AND e.user_id = :user_id'
        );
        $req->bindValue(':id', $participantId, PDO::PARAM_INT);
        $req->bindValue(':expense_id', $expenseId, PDO::PARAM_INT);
        $req->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $req->execute();

        return $req->rowCount() > 0;
    }
}
