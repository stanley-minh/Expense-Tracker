<?php

namespace App\Controllers;

use App\Core\Auth;
use App\Core\HttpException;
use App\Core\Request;
use App\Core\Response;
use App\Models\ModelUser;
use App\Validators\UserValidator;

/**
 * Handles the /api/auth routes: registration, login, logout, current user.
 */
final class AuthController extends Controller
{
    /**
     * Hash of a random password, used when the email does not exist so that
     * password_verify() still runs: the response takes the same time whether
     * the email exists or not, so the timing cannot reveal registered emails.
     * Same algorithm and cost as real hashes for the timing to match: cost 12 is
     * PASSWORD_DEFAULT's cost since PHP 8.4 (the Docker image runs PHP 8.5).
     */
    private const DUMMY_HASH = '$2y$12$BH8kCZhwV6YeIvb.h7V41uK.S8G6W..AWY5nN/TR5GnKRgLUmSw3O';

    public function __construct()
    {
        parent::__construct(new ModelUser());
    }

    /**
     * POST /api/auth/register — creates an account, then logs the user in.
     * Body: {"name", "email", "password", "registration_code"}
     * The registration code is shared by the church: without it, nobody can sign up.
     */
    public function register(): void
    {
        if (REGISTRATION_CODE === '') {
            throw new HttpException(403, 'Les inscriptions sont fermées.');
        }

        $body = $this->readBody();
        $errors = UserValidator::validateRegistration($body);

        // hash_equals: compares in constant time (a normal === stops at the first
        // different character, and that duration could leak the code bit by bit)
        $code = $body['registration_code'] ?? null;
        if (!is_string($code) || !hash_equals(REGISTRATION_CODE, $code)) {
            $errors['registration_code'] = "Code d'inscription invalide.";
        }

        $email = UserValidator::normalizeEmail((string) ($body['email'] ?? ''));
        if (!isset($errors['email']) && $this->getModel()->emailExists($email)) {
            $errors['email'] = 'Un compte existe déjà avec cette adresse e-mail.';
        }

        if ($errors !== []) {
            Response::json(['errors' => $errors], 422);
            return;
        }

        $userId = $this->getModel()->create(
            trim($body['name']),
            $email,
            // password_hash: one-way hash + random salt; the real password is never stored
            password_hash($body['password'], PASSWORD_DEFAULT)
        );

        Auth::login($userId);
        Response::json($this->getModel()->findById($userId), 201);
    }

    /**
     * POST /api/auth/login — Body: {"email", "password"}
     */
    public function login(): void
    {
        $body = $this->readBody();
        $email = UserValidator::normalizeEmail((string) ($body['email'] ?? ''));
        $password = (string) ($body['password'] ?? '');

        $credentials = $this->getModel()->findCredentialsByEmail($email);

        // Always run password_verify (see DUMMY_HASH), then check both conditions
        $isValid = password_verify($password, $credentials['password_hash'] ?? self::DUMMY_HASH)
            && $credentials !== null;

        if (!$isValid) {
            // Same message for "unknown email" and "wrong password":
            // an attacker cannot find out which emails have an account
            throw new HttpException(401, 'E-mail ou mot de passe incorrect.');
        }

        // If PHP now recommends a stronger algorithm or cost, upgrade the stored hash
        if (password_needs_rehash($credentials['password_hash'], PASSWORD_DEFAULT)) {
            $this->getModel()->updatePasswordHash($credentials['id'], password_hash($password, PASSWORD_DEFAULT));
        }

        Auth::login($credentials['id']);
        Response::json($this->getModel()->findById($credentials['id']));
    }

    /**
     * POST /api/auth/logout
     */
    public function logout(): void
    {
        Auth::logout();
        Response::noContent();
    }

    /**
     * GET /api/auth/me — returns the logged-in user (the frontend calls it on startup).
     */
    public function me(): void
    {
        $userId = Auth::requireUserId();
        $user = $this->getModel()->findById($userId);

        if ($user === null) {
            // The account was deleted while this session was still open
            Auth::logout();
            throw new HttpException(401, 'Vous devez être connecté.');
        }

        Response::json($user);
    }

    /**
     * @return array<string, mixed>
     * @throws HttpException 400 when the body is not a JSON object
     */
    private function readBody(): array
    {
        $body = Request::json();
        if ($body === null) {
            throw new HttpException(400, 'Le corps de la requête doit être un objet JSON.');
        }

        return $body;
    }
}
