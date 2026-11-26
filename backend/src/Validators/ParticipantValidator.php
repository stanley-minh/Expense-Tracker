<?php

namespace App\Validators;

/**
 * Validates the participants of a shared expense (first names).
 *
 * Pure functions, like ExpenseValidator: no database access, easy to test.
 * The database still has its own UNIQUE (expense_id, name) constraint as a last
 * safety net (defense in depth).
 *
 * Error messages are in French: they are shown as-is to the app's users.
 */
final class ParticipantValidator
{
    /** Max length of a name (VARCHAR(100) column). */
    public const MAX_NAME_LENGTH = 100;

    /** Max number of people on one expense: a large church meal, not a whole city. */
    public const MAX_PARTICIPANTS = 1000;

    /**
     * Checks one name (POST /api/expenses/{id}/participants).
     *
     * @param mixed $name Value sent by the client
     * @return string|null French error message, or null when the name is valid
     */
    public static function validateName(mixed $name): ?string
    {
        if (!is_string($name) || trim($name) === '') {
            return 'Le prénom est obligatoire.';
        }
        // mb_strlen counts characters, strlen would count bytes ("é" = 2 bytes)
        if (mb_strlen(trim($name)) > self::MAX_NAME_LENGTH) {
            return 'Le prénom ne doit pas dépasser ' . self::MAX_NAME_LENGTH . ' caractères.';
        }

        return null;
    }

    /**
     * Checks the optional list of names sent when an expense is created.
     *
     * Absent or empty list = expense not shared. Duplicates are rejected here with a
     * clear message, comparing lowercase names ("Léa" = "léa"). MySQL is even stricter
     * (it also ignores accents: "Léa" = "Lea"); that rare case is caught by the
     * UNIQUE constraint, see ExpenseController::store().
     *
     * @param mixed $names Value of the "participants" field of the body
     * @return string|null French error message, or null when the list is valid
     */
    public static function validateNames(mixed $names): ?string
    {
        if ($names === null) {
            return null; // field absent: not shared
        }
        if (!is_array($names) || !array_is_list($names)) {
            return 'Les participants doivent être une liste de prénoms.';
        }
        if (count($names) > self::MAX_PARTICIPANTS) {
            return 'Une dépense ne peut pas être partagée entre plus de '
                . self::MAX_PARTICIPANTS . ' personnes.';
        }

        $seen = [];
        foreach ($names as $name) {
            $error = self::validateName($name);
            if ($error !== null) {
                return $error;
            }

            $key = mb_strtolower(trim($name));
            if (isset($seen[$key])) {
                return '« ' . trim($name) . ' » apparaît deux fois dans la liste.';
            }
            $seen[$key] = true; // array keys used as a set: isset() is O(1)
        }

        return null;
    }

    /**
     * Returns the trimmed names, in the order they were sent.
     * Call it only after validateNames() returned null.
     *
     * @param mixed $names Value of the "participants" field of the body
     * @return list<string>
     */
    public static function cleanNames(mixed $names): array
    {
        return $names === null ? [] : array_map('trim', $names);
    }
}
