<?php

namespace App\Validators;

/**
 * Validates account data (registration, profile update).
 * Pure functions: no database access (email uniqueness is checked by the controller).
 * Error messages are in French: they are shown as-is to the app's users.
 */
final class UserValidator
{
    /** Max length of the name (VARCHAR(100) column). */
    private const MAX_NAME_LENGTH = 100;

    /** Max length of the email (VARCHAR(255) column). */
    private const MAX_EMAIL_LENGTH = 255;

    /**
     * Minimum password length. Length matters more than complexity rules:
     * each extra character multiplies the number of possible passwords.
     */
    private const MIN_PASSWORD_LENGTH = 12;

    /**
     * bcrypt (the algorithm behind PASSWORD_DEFAULT) only uses the first 72 BYTES
     * of a password and silently ignores the rest: longer passwords are refused.
     */
    private const MAX_PASSWORD_BYTES = 72;

    /**
     * Checks the registration form.
     *
     * @param array<string, mixed> $data Decoded JSON body
     * @return array<string, string> Field name => error message (empty array = valid)
     */
    public static function validateRegistration(array $data): array
    {
        $errors = self::validateProfile($data);

        $passwordError = self::passwordError($data['password'] ?? null);
        if ($passwordError !== null) {
            $errors['password'] = $passwordError;
        }

        return $errors;
    }

    /**
     * Checks the account update form: name and email are required, the current
     * password is required to confirm, the new password is optional.
     *
     * @param array<string, mixed> $data Decoded JSON body
     * @return array<string, string> Field name => error message (empty array = valid)
     */
    public static function validateAccountUpdate(array $data): array
    {
        $errors = self::validateProfile($data);

        if (!is_string($data['current_password'] ?? null) || $data['current_password'] === '') {
            $errors['current_password'] = 'Saisissez votre mot de passe actuel pour confirmer.';
        }

        // New password: only checked when the user filled it in
        $newPassword = $data['new_password'] ?? null;
        if ($newPassword !== null && $newPassword !== '') {
            $passwordError = self::passwordError($newPassword);
            if ($passwordError !== null) {
                $errors['new_password'] = $passwordError;
            }
        }

        return $errors;
    }

    /**
     * Normalizes an email so that "Jean@Mail.fr " and "jean@mail.fr" are the same account.
     */
    public static function normalizeEmail(string $email): string
    {
        return mb_strtolower(trim($email));
    }

    /**
     * Checks the name and the email (shared by registration and account update).
     *
     * @param array<string, mixed> $data
     * @return array<string, string>
     */
    private static function validateProfile(array $data): array
    {
        $errors = [];

        $name = $data['name'] ?? null;
        if (!is_string($name) || trim($name) === '') {
            $errors['name'] = 'Le nom est obligatoire.';
        } elseif (mb_strlen(trim($name)) > self::MAX_NAME_LENGTH) {
            $errors['name'] = 'Le nom ne doit pas dépasser ' . self::MAX_NAME_LENGTH . ' caractères.';
        }

        $email = $data['email'] ?? null;
        if (
            !is_string($email)
            || filter_var(trim($email), FILTER_VALIDATE_EMAIL) === false
            || mb_strlen(trim($email)) > self::MAX_EMAIL_LENGTH
        ) {
            $errors['email'] = 'Saisissez une adresse e-mail valide.';
        }

        return $errors;
    }

    /**
     * Returns the error message for an invalid password, or null when it is valid.
     */
    private static function passwordError(mixed $password): ?string
    {
        if (!is_string($password) || mb_strlen($password) < self::MIN_PASSWORD_LENGTH) {
            return 'Le mot de passe doit contenir au moins ' . self::MIN_PASSWORD_LENGTH . ' caractères.';
        }

        // strlen counts BYTES (what bcrypt sees): "é" = 2 bytes
        if (strlen($password) > self::MAX_PASSWORD_BYTES) {
            return 'Le mot de passe est trop long (72 octets maximum).';
        }

        return null;
    }
}
