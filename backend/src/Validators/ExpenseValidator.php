<?php

namespace App\Validators;

use DateTimeImmutable;

/**
 * Validates the data of an expense sent by the client.
 *
 * The database also has CHECK constraints (defense in depth), but validating
 * here lets the API return clear messages instead of a generic 500 error.
 *
 * Error messages are in French: they are shown as-is to the app's users.
 */
final class ExpenseValidator
{
    /**
     * Business rule: a single expense never exceeds 10,000.00 €.
     * Larger expenses (building, legal...) are handled by the church's accountant.
     * 1,000,000 cents = 10,000.00 €.
     */
    private const MAX_AMOUNT_CENTS = 1_000_000;

    /** Slug of the category that lets the user type their own category name. */
    private const OTHER_CATEGORY_SLUG = 'other';

    /** Max length of the free-text category (VARCHAR(100) column). */
    private const MAX_DETAIL_LENGTH = 100;

    /** Number of people an expense can be shared between (same limit as the CHECK in MySQL). */
    private const MAX_PARTICIPANTS = 1000;

    /**
     * Checks every field and returns the list of errors.
     *
     * The categories are passed in rather than read from the database:
     * the validator stays a pure function (same input -> same output), easy to
     * test without MySQL.
     *
     * @param array<string, mixed> $data           Decoded JSON body
     * @param array<int, string>   $categorySlugs  Existing categories, id => slug (e.g. [6 => 'other'])
     * @return array<string, string> Field name => error message (empty array = valid)
     */
    public static function validate(array $data, array $categorySlugs): array
    {
        $errors = [];

        // label: non-empty string, at most 255 characters (VARCHAR(255))
        $label = $data['label'] ?? null;
        if (!is_string($label) || trim($label) === '') {
            $errors['label'] = 'Le libellé est obligatoire.';
        } elseif (mb_strlen(trim($label)) > 255) {
            // mb_strlen counts characters, strlen would count bytes ("é" = 2 bytes)
            $errors['label'] = 'Le libellé ne doit pas dépasser 255 caractères.';
        }

        // category_id: integer that matches an existing category
        $categoryId = $data['category_id'] ?? null;
        if (!is_int($categoryId) || !array_key_exists($categoryId, $categorySlugs)) {
            $errors['category_id'] = 'Choisissez une catégorie dans la liste.';
        } elseif ($categorySlugs[$categoryId] === self::OTHER_CATEGORY_SLUG) {
            // category_detail: required ONLY when the category is "other" (Autre)
            $detail = $data['category_detail'] ?? null;
            if (!is_string($detail) || trim($detail) === '') {
                $errors['category_detail'] = 'Précisez la catégorie.';
            } elseif (mb_strlen(trim($detail)) > self::MAX_DETAIL_LENGTH) {
                $errors['category_detail'] = 'La catégorie ne doit pas dépasser '
                    . self::MAX_DETAIL_LENGTH . ' caractères.';
            }
        }

        // amount_cents: strictly positive integer, at most 10,000.00 € (business rule)
        $amount = $data['amount_cents'] ?? null;
        if (!is_int($amount)) {
            // is_int rejects "4250" (string) and 42.5 (float): amounts are whole cents
            $errors['amount_cents'] = 'Le montant doit être un nombre entier de centimes.';
        } elseif ($amount <= 0 || $amount > self::MAX_AMOUNT_CENTS) {
            $errors['amount_cents'] = 'Le montant doit être compris entre 0,01 € et 10 000,00 €.';
        }

        // participants_count: optional (1 = not shared), integer between 1 and 1000
        $participants = $data['participants_count'] ?? 1;
        if (!is_int($participants) || $participants < 1 || $participants > self::MAX_PARTICIPANTS) {
            $errors['participants_count'] = 'Le nombre de personnes doit être un entier entre 1 et '
                . self::MAX_PARTICIPANTS . '.';
        }

        // spent_at: real calendar date in YYYY-MM-DD format
        $date = $data['spent_at'] ?? null;
        if (!is_string($date) || !self::isValidDate($date)) {
            $errors['spent_at'] = 'La date doit être une date valide au format AAAA-MM-JJ.';
        }

        return $errors;
    }

    /**
     * Returns the cleaned values to store (only the expected fields, text trimmed).
     * Call it only after validate() returned no error.
     *
     * category_detail is kept only for the "other" category: for any other
     * category it is forced to null, even if the client sent something.
     *
     * @param array<string, mixed> $data          Decoded JSON body
     * @param array<int, string>   $categorySlugs Existing categories, id => slug
     * @return array{label: string, category_id: int, category_detail: ?string, amount_cents: int, participants_count: int, spent_at: string}
     */
    public static function clean(array $data, array $categorySlugs): array
    {
        $isOther = $categorySlugs[$data['category_id']] === self::OTHER_CATEGORY_SLUG;

        return [
            'label'              => trim($data['label']),
            'category_id'        => $data['category_id'],
            'category_detail'    => $isOther ? trim($data['category_detail']) : null,
            'amount_cents'       => $data['amount_cents'],
            'participants_count' => $data['participants_count'] ?? 1, // absent = not shared
            'spent_at'           => $data['spent_at'],
        ];
    }

    /**
     * Checks that a string is an existing date ("2026-02-30" is rejected).
     *
     * createFromFormat() silently "overflows" impossible dates
     * (2026-02-30 becomes 2026-03-02), so the result is formatted back
     * and compared with the input: they differ if the date did not exist.
     */
    private static function isValidDate(string $date): bool
    {
        $parsed = DateTimeImmutable::createFromFormat('!Y-m-d', $date);

        return $parsed !== false && $parsed->format('Y-m-d') === $date;
    }
}
