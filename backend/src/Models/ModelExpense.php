<?php

namespace App\Models;

use PDO;
use Throwable;

/**
 * Data access for the "expenses" table (and the participants attached to each expense).
 *
 * Every query is a prepared statement: values are sent to MySQL separately
 * from the SQL text, so they can never be interpreted as SQL (no injection).
 *
 * Every query also filters on user_id: each accountant only sees and changes
 * their OWN expenses. Asking for another user's expense by its id behaves
 * exactly as if it did not exist (null / false -> 404), so ids of other users'
 * expenses cannot even be detected.
 *
 * Each expense is returned with its "participants" list, each participant with
 * its computed "share_cents" (see withShares()).
 */
final class ModelExpense extends Model
{
    /**
     * Base query shared by findAll() and findById().
     *
     * JOIN: each expense row is combined with the row of its category
     * (matching categories.id = expenses.category_id), so the category
     * name comes back in the same query.
     * Aliases: "e" = expenses, "c" = categories; "c.name AS category_name"
     * renames the column to avoid confusion with other "name" columns.
     */
    private const SELECT_WITH_CATEGORY = '
        SELECT e.id, e.label, e.category_id, c.slug AS category_slug, c.name AS category_name,
               e.category_detail, e.amount_cents, e.spent_at, e.is_validated, e.validated_at
        FROM expenses e
        INNER JOIN categories c ON c.id = e.category_id';

    /**
     * Participants of a user's expenses. The JOIN on expenses is what restricts
     * them to the owner: expense_participants has no user_id column of its own.
     * ORDER BY p.id: always the same order, so the extra cents of the split
     * always go to the same people (see withShares()).
     */
    private const SELECT_PARTICIPANTS = '
        SELECT p.id, p.expense_id, p.name, p.has_paid, p.paid_at
        FROM expense_participants p
        INNER JOIN expenses e ON e.id = p.expense_id
        WHERE e.user_id = :user_id';

    /**
     * Returns every expense of a user, most recent first, with their participants.
     *
     * 2 queries in total, whatever the number of expenses: one for the expenses,
     * one for ALL their participants, matched in PHP. The naive version (one
     * participants query per expense) would run 1 + N queries: the "N+1 problem",
     * which gets slow as soon as the list grows.
     *
     * @param int $userId Owner of the expenses (the logged-in user)
     * @return list<array<string, mixed>>
     */
    public function findAll(int $userId): array
    {
        $req = $this->getBdd()->prepare(
            self::SELECT_WITH_CATEGORY . ' WHERE e.user_id = :user_id ORDER BY e.spent_at DESC, e.id DESC'
        );
        $req->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $req->execute();
        $expenses = $req->fetchAll();

        $req = $this->getBdd()->prepare(self::SELECT_PARTICIPANTS . ' ORDER BY p.id');
        $req->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $req->execute();

        // Group the participants by expense: [expense_id => [participant, ...]]
        $participantsByExpense = [];
        foreach ($req->fetchAll() as $participant) {
            $participantsByExpense[$participant['expense_id']][] = $participant;
        }

        return array_map(
            fn (array $expense) => self::hydrate($expense, $participantsByExpense[$expense['id']] ?? []),
            $expenses
        );
    }

    /**
     * Returns one expense of a user (with its participants), or null when it does
     * not exist OR belongs to someone else.
     *
     * @param int $id     Expense id
     * @param int $userId Owner of the expense (the logged-in user)
     * @return array<string, mixed>|null
     */
    public function findById(int $id, int $userId): ?array
    {
        $req = $this->getBdd()->prepare(
            self::SELECT_WITH_CATEGORY . ' WHERE e.id = :id AND e.user_id = :user_id'
        );
        // bindValue: binds the value right now, with an explicit SQL type
        $req->bindValue(':id', $id, PDO::PARAM_INT);
        $req->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $req->execute();

        $expense = $req->fetch();
        if ($expense === false) { // fetch() returns false when no row
            return null;
        }

        $req = $this->getBdd()->prepare(
            self::SELECT_PARTICIPANTS . ' AND p.expense_id = :expense_id ORDER BY p.id'
        );
        $req->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $req->bindValue(':expense_id', $id, PDO::PARAM_INT);
        $req->execute();

        return self::hydrate($expense, $req->fetchAll());
    }

    /**
     * Inserts a new expense for a user (not validated yet), with its participants.
     *
     * Transaction: the expense and its participants are saved together or not at all.
     * Without it, a failure on the 3rd participant (e.g. a duplicate name) would leave
     * an expense with only 2 participants in the database.
     *
     * @param array{label: string, category_id: int, category_detail: ?string, amount_cents: int, spent_at: string} $data Validated data
     * @param int          $userId Owner of the expense
     * @param list<string> $names  Validated participant names (empty = not shared)
     * @return int Id generated by AUTO_INCREMENT
     * @throws \PDOException e.g. duplicate name (SQLSTATE 23000): nothing has been saved
     */
    public function create(array $data, int $userId, array $names = []): int
    {
        $bdd = $this->getBdd();
        $bdd->beginTransaction();

        try {
            $req = $bdd->prepare(
                'INSERT INTO expenses (user_id, label, category_id, category_detail, amount_cents, spent_at)
                 VALUES (:user_id, :label, :category_id, :category_detail, :amount_cents, :spent_at)'
            );
            $req->bindValue(':user_id', $userId, PDO::PARAM_INT);
            $req->bindValue(':label', $data['label']);
            $req->bindValue(':category_id', $data['category_id'], PDO::PARAM_INT);
            self::bindNullableString($req, ':category_detail', $data['category_detail']);
            $req->bindValue(':amount_cents', $data['amount_cents'], PDO::PARAM_INT);
            $req->bindValue(':spent_at', $data['spent_at']);
            $req->execute();

            $expenseId = (int) $bdd->lastInsertId();

            // Prepared once, executed once per name: MySQL parses the SQL only one time
            $req = $bdd->prepare(
                'INSERT INTO expense_participants (expense_id, name) VALUES (:expense_id, :name)'
            );
            foreach ($names as $name) {
                $req->bindValue(':expense_id', $expenseId, PDO::PARAM_INT);
                $req->bindValue(':name', $name);
                $req->execute();
            }

            $bdd->commit();

            return $expenseId;
        } catch (Throwable $e) {
            $bdd->rollBack(); // cancels everything done since beginTransaction()
            throw $e;         // the caller decides what to answer (422, 500...)
        }
    }

    /**
     * Replaces every editable field of an expense. Neither the validation status
     * (PATCH .../validation) nor the participants (/participants routes) are touched.
     *
     * Existence must be checked BEFORE (findById): MySQL's rowCount() returns 0
     * when the new values equal the old ones, so it cannot tell "not found".
     *
     * @param int $id     Expense id
     * @param int $userId Owner of the expense
     * @param array{label: string, category_id: int, category_detail: ?string, amount_cents: int, spent_at: string} $data Validated data
     */
    public function update(int $id, int $userId, array $data): void
    {
        $req = $this->getBdd()->prepare(
            'UPDATE expenses
             SET label = :label, category_id = :category_id, category_detail = :category_detail,
                 amount_cents = :amount_cents, spent_at = :spent_at
             WHERE id = :id AND user_id = :user_id'
        );
        $req->bindValue(':label', $data['label']);
        $req->bindValue(':category_id', $data['category_id'], PDO::PARAM_INT);
        self::bindNullableString($req, ':category_detail', $data['category_detail']);
        $req->bindValue(':amount_cents', $data['amount_cents'], PDO::PARAM_INT);
        $req->bindValue(':spent_at', $data['spent_at']);
        $req->bindValue(':id', $id, PDO::PARAM_INT);
        $req->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $req->execute();
    }

    /**
     * Marks an expense as validated (with the current date) or not validated.
     *
     * A named placeholder cannot appear twice in a query with real prepared
     * statements, hence :is_validated AND :is_validated_again (same value).
     *
     * @param int  $id          Expense id
     * @param int  $userId      Owner of the expense
     * @param bool $isValidated New status
     */
    public function setValidated(int $id, int $userId, bool $isValidated): void
    {
        $req = $this->getBdd()->prepare(
            'UPDATE expenses
             SET is_validated = :is_validated,
                 validated_at = IF(:is_validated_again, NOW(), NULL)
             WHERE id = :id AND user_id = :user_id'
        );
        $req->bindValue(':is_validated', $isValidated, PDO::PARAM_BOOL);
        $req->bindValue(':is_validated_again', $isValidated, PDO::PARAM_BOOL);
        $req->bindValue(':id', $id, PDO::PARAM_INT);
        $req->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $req->execute();
    }

    /**
     * Deletes an expense of a user. Its participants are deleted by MySQL
     * (ON DELETE CASCADE on expense_participants.expense_id).
     *
     * @return bool true if a row was deleted, false if it did not exist (or belongs to someone else)
     */
    public function delete(int $id, int $userId): bool
    {
        $req = $this->getBdd()->prepare('DELETE FROM expenses WHERE id = :id AND user_id = :user_id');
        $req->bindValue(':id', $id, PDO::PARAM_INT);
        $req->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $req->execute();

        return $req->rowCount() > 0; // number of deleted rows: 0 or 1
    }

    /**
     * Splits an amount between n people, to the exact cent (same algorithm as
     * splitCents() in frontend/src/utils/money.ts).
     *
     * Euclidean division: total = quotient × n + remainder, with 0 <= remainder < n.
     * Everyone pays the quotient, and the first "remainder" people pay 1 cent more,
     * so the shares always add up EXACTLY to the total.
     *
     * @example shares(4250, 4) // [1063, 1063, 1062, 1062]
     * @param int $totalCents Amount to split, in cents
     * @param int $people     Number of people (>= 1)
     * @return list<int> One share per person, in order
     */
    public static function shares(int $totalCents, int $people): array
    {
        $quotient  = intdiv($totalCents, $people); // integer division (no float)
        $remainder = $totalCents % $people;

        $shares = [];
        for ($i = 0; $i < $people; $i++) {
            $shares[] = $quotient + ($i < $remainder ? 1 : 0);
        }

        return $shares;
    }

    /**
     * Converts the MySQL types to the JSON types expected by the frontend, and
     * attaches the participants with their share.
     *
     * MySQL has no real boolean type: BOOLEAN is an alias of TINYINT(1),
     * so is_validated / has_paid come back as 0 or 1. They are turned into false / true.
     *
     * @param array<string, mixed>       $row          Expense row returned by PDO
     * @param list<array<string, mixed>> $participants Its participants, sorted by id
     * @return array<string, mixed>
     */
    private static function hydrate(array $row, array $participants): array
    {
        $row['is_validated'] = (bool) $row['is_validated'];

        $shares = $participants === [] ? [] : self::shares($row['amount_cents'], count($participants));

        $row['participants'] = array_map(
            fn (array $participant, int $share) => [
                'id'          => $participant['id'],
                'name'        => $participant['name'],
                'has_paid'    => (bool) $participant['has_paid'],
                'paid_at'     => $participant['paid_at'],
                'share_cents' => $share,
            ],
            $participants,
            $shares
        );

        return $row;
    }

    /**
     * Binds a value that may be null: a real SQL NULL must be sent with
     * PDO::PARAM_NULL, not as the text "" or "null".
     */
    private static function bindNullableString(\PDOStatement $req, string $placeholder, ?string $value): void
    {
        $req->bindValue($placeholder, $value, $value === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
    }
}
