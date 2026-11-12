<?php

namespace App\Core;

/**
 * Authentication with a PHP session.
 *
 * How it works: after a successful login, PHP stores the user id on the server
 * ($_SESSION) and sends the browser a cookie that only contains a random session id.
 * The browser sends this cookie back with every request, so PHP knows who is calling.
 * The user id itself never travels: the client cannot forge it.
 */
final class Auth
{
    /** Name of the session cookie (instead of the default "PHPSESSID", which reveals PHP). */
    private const COOKIE_NAME = 'expense_session';

    /** Key under which the logged-in user id is stored in $_SESSION. */
    private const SESSION_KEY = 'user_id';

    /**
     * Returns the id of the logged-in user, or null when nobody is logged in.
     */
    public static function userId(): ?int
    {
        // No cookie = no session: don't start one (it would send a useless cookie)
        if (!isset($_COOKIE[self::COOKIE_NAME])) {
            return null;
        }

        self::start();

        return isset($_SESSION[self::SESSION_KEY]) ? (int) $_SESSION[self::SESSION_KEY] : null;
    }

    /**
     * Returns the id of the logged-in user, or stops the request with a 401.
     *
     * @throws HttpException 401 when nobody is logged in
     */
    public static function requireUserId(): int
    {
        $userId = self::userId();

        if ($userId === null) {
            throw new HttpException(401, 'Vous devez être connecté.');
        }

        return $userId;
    }

    /**
     * Logs a user in (after their password has been checked).
     */
    public static function login(int $userId): void
    {
        self::start();
        // New session id at login: an id an attacker might have planted
        // in the victim's browser before login becomes useless (session fixation)
        session_regenerate_id(true);
        $_SESSION[self::SESSION_KEY] = $userId;
    }

    /**
     * Logs the current user out: empties the session, destroys it and removes the cookie.
     */
    public static function logout(): void
    {
        if (!isset($_COOKIE[self::COOKIE_NAME])) {
            return; // nobody to log out
        }

        self::start();
        $_SESSION = [];
        // An expiry date in the past tells the browser to delete the cookie
        setcookie(self::COOKIE_NAME, '', ['expires' => time() - 3600] + self::cookieOptions());
        session_destroy();
    }

    /**
     * Starts the session with secure cookie settings (only once per request).
     */
    private static function start(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        // Strict mode: PHP refuses session ids it did not create itself
        ini_set('session.use_strict_mode', '1');
        session_name(self::COOKIE_NAME);
        session_set_cookie_params(['lifetime' => 0] + self::cookieOptions());
        session_start();
    }

    /**
     * Security options of the session cookie.
     *
     * @return array{path: string, secure: bool, httponly: bool, samesite: string}
     */
    private static function cookieOptions(): array
    {
        return [
            'path'     => '/',
            // secure: cookie only sent over HTTPS (automatically true in production behind HTTPS)
            'secure'   => ($_SERVER['HTTPS'] ?? 'off') !== 'off',
            // httponly: JavaScript cannot read the cookie, so an XSS flaw cannot steal it
            'httponly' => true,
            // Lax: cookie not sent with requests coming from another site (protects against CSRF)
            'samesite' => 'Lax',
        ];
    }
}
