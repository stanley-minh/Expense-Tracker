<?php

namespace App\Models;

use PDO;

/**
 * Data access for the "users" table (accountants).
 *
 * The password hash is only returned by findPasswordHashBy*(): every other
 * method returns "public" columns, so a hash can never end up in a JSON response.
 */
final class ModelUser extends Model
{
    /** Columns that can be sent to the client. */
    private const PUBLIC_COLUMNS = 'id, name, email, created_at';

    /**
     * @return array{id: int, name: string, email: string, created_at: string}|null
     */
    public function findById(int $id): ?array
    {
        $req = $this->getBdd()->prepare('SELECT ' . self::PUBLIC_COLUMNS . ' FROM users WHERE id = :id');
        $req->bindValue(':id', $id, PDO::PARAM_INT);
        $req->execute();

        $user = $req->fetch();

        return $user === false ? null : $user;
    }

    /**
     * Returns the id and password hash of the user with this email (used by login).
     *
     * @return array{id: int, password_hash: string}|null
     */
    public function findCredentialsByEmail(string $email): ?array
    {
        $req = $this->getBdd()->prepare('SELECT id, password_hash FROM users WHERE email = :email');
        $req->bindValue(':email', $email);
        $req->execute();

        $credentials = $req->fetch();

        return $credentials === false ? null : $credentials;
    }

    /**
     * Returns the password hash of a user (used to confirm a sensitive action).
     */
    public function findPasswordHashById(int $id): ?string
    {
        $req = $this->getBdd()->prepare('SELECT password_hash FROM users WHERE id = :id');
        $req->bindValue(':id', $id, PDO::PARAM_INT);
        $req->execute();

        $hash = $req->fetchColumn(); // first column of the first row, or false

        return $hash === false ? null : $hash;
    }

    /**
     * Tells whether an email is already used, optionally ignoring one user
     * (when a user saves their own unchanged email, it is not a duplicate).
     */
    public function emailExists(string $email, ?int $exceptUserId = null): bool
    {
        $req = $this->getBdd()->prepare(
            'SELECT COUNT(*) FROM users WHERE email = :email AND id <> :except_id'
        );
        $req->bindValue(':email', $email);
        $req->bindValue(':except_id', $exceptUserId ?? 0, PDO::PARAM_INT); // 0 = no real id

        $req->execute();

        return (int) $req->fetchColumn() > 0;
    }

    /**
     * @return int Id of the new user
     */
    public function create(string $name, string $email, string $passwordHash): int
    {
        $req = $this->getBdd()->prepare(
            'INSERT INTO users (name, email, password_hash) VALUES (:name, :email, :password_hash)'
        );
        $req->bindValue(':name', $name);
        $req->bindValue(':email', $email);
        $req->bindValue(':password_hash', $passwordHash);
        $req->execute();

        return (int) $this->getBdd()->lastInsertId();
    }

    public function updateProfile(int $id, string $name, string $email): void
    {
        $req = $this->getBdd()->prepare('UPDATE users SET name = :name, email = :email WHERE id = :id');
        $req->bindValue(':name', $name);
        $req->bindValue(':email', $email);
        $req->bindValue(':id', $id, PDO::PARAM_INT);
        $req->execute();
    }

    public function updatePasswordHash(int $id, string $passwordHash): void
    {
        $req = $this->getBdd()->prepare('UPDATE users SET password_hash = :password_hash WHERE id = :id');
        $req->bindValue(':password_hash', $passwordHash);
        $req->bindValue(':id', $id, PDO::PARAM_INT);
        $req->execute();
    }

    /**
     * Deletes a user. Their expenses are deleted too by MySQL
     * (foreign key ON DELETE CASCADE in 01_schema.sql).
     */
    public function delete(int $id): void
    {
        $req = $this->getBdd()->prepare('DELETE FROM users WHERE id = :id');
        $req->bindValue(':id', $id, PDO::PARAM_INT);
        $req->execute();
    }
}
