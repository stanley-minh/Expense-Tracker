<?php

namespace App\Validators;

use DateTimeImmutable;

/**
 * Validates the data of an expense sent by the client.
 *
 * The database also has CHECK constraints (defense in depth), but validating
 * here lets the API return clear messages instead of a generic 500 error.
 */
final class ExpenseValidator
{
    /**
     * Business rule: a single expense (food, hygiene, events) never exceeds 10,000.00 €.
     * Larger expenses (building, legal...) are handled by the church's accountant.
     * 1,000,000 cents = 10,000.00 €.
     */
    private const MAX_AMOUNT_CENTS = 1_000_000;

    /**
     * Checks every field and returns the list of errors.
     *
     * @param array<string, mixed> $data Decoded JSON body
     * @return array<string, string> Field name => error message (empty array = valid)
     */
    public static function validate(array $data): array
    {
        $errors = [];

        // label: non-empty string, at most 255 characters (VARCHAR(255))
        $label = $data['label'] ?? null;
        if (!is_string($label) || trim($label) === '') {
            $errors['label'] = 'Label is required.';
        } elseif (mb_strlen(trim($label)) > 255) {
            // mb_strlen counts characters, strlen would count bytes ("é" = 2 bytes)
            $errors['label'] = 'Label must be at most 255 characters.';
        }

        // amount_cents: strictly positive integer, at most 10,000.00 € (business rule)
        $amount = $data['amount_cents'] ?? null;
        if (!is_int($amount)) {
            // is_int rejects "4250" (string) and 42.5 (float): amounts are whole cents
            $errors['amount_cents'] = 'Amount must be an integer number of cents.';
        } elseif ($amount <= 0 || $amount > self::MAX_AMOUNT_CENTS) {
            $errors['amount_cents'] = 'Amount must be between 1 and ' . self::MAX_AMOUNT_CENTS
                . ' cents (€0.01 to €10,000.00).';
        }

        // spent_at: real calendar date in YYYY-MM-DD format
        $date = $data['spent_at'] ?? null;
        if (!is_string($date) || !self::isValidDate($date)) {
            $errors['spent_at'] = 'Date must be a valid date in YYYY-MM-DD format.';
        }

        return $errors;
    }

    /**
     * Returns the cleaned values to store (only the expected fields, label trimmed).
     * Call it only after validate() returned no error.
     *
     * @param array<string, mixed> $data Decoded JSON body
     * @return array{label: string, amount_cents: int, spent_at: string}
     */
    public static function clean(array $data): array
    {
        return [
            'label'        => trim($data['label']),
            'amount_cents' => $data['amount_cents'],
            'spent_at'     => $data['spent_at'],
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
