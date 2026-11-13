<?php

namespace App\Controllers;

use App\Core\Auth;
use App\Core\HttpException;
use App\Core\Request;
use App\Core\Response;
use App\Models\ModelUser;
use App\Validators\UserValidator;

/**
 * Handles /api/account: the logged-in user edits or deletes their OWN account.
 * Both actions require the current password: someone using a computer left
 * logged in cannot take over or delete the account.
 */
final class AccountController extends Controller
{
    public function __construct()
    {
        parent::__construct(new ModelUser());
    }

    /**
     * PUT /api/account — Body: {"name", "email", "current_password", "new_password" (optional)}
     */
    public function update(): void
    {
        $userId = Auth::requireUserId();
        $body = $this->readBody();

        $errors = UserValidator::validateAccountUpdate($body);

        if (!isset($errors['current_password']) && !$this->isCurrentPassword($userId, $body['current_password'])) {
            $errors['current_password'] = 'Mot de passe actuel incorrect.';
        }

        $email = UserValidator::normalizeEmail((string) ($body['email'] ?? ''));
        if (!isset($errors['email']) && $this->getModel()->emailExists($email, $userId)) {
            $errors['email'] = 'Un compte existe déjà avec cette adresse e-mail.';
        }

        if ($errors !== []) {
            Response::json(['errors' => $errors], 422);
            return;
        }

        $this->getModel()->updateProfile($userId, trim($body['name']), $email);

        $newPassword = $body['new_password'] ?? '';
        if ($newPassword !== '') {
            $this->getModel()->updatePasswordHash($userId, password_hash($newPassword, PASSWORD_DEFAULT));
        }

        Response::json($this->getModel()->findById($userId));
    }

    /**
     * DELETE /api/account — Body: {"password"}
     * Deletes the account AND all its expenses (ON DELETE CASCADE), then logs out.
     */
    public function destroy(): void
    {
        $userId = Auth::requireUserId();
        $body = $this->readBody();

        $password = $body['password'] ?? null;
        if (!is_string($password) || !$this->isCurrentPassword($userId, $password)) {
            Response::json(['errors' => ['password' => 'Mot de passe incorrect.']], 422);
            return;
        }

        $this->getModel()->delete($userId);
        Auth::logout();
        Response::noContent();
    }

    /**
     * Checks a password against the stored hash of the user.
     */
    private function isCurrentPassword(int $userId, string $password): bool
    {
        $hash = $this->getModel()->findPasswordHashById($userId);

        return $hash !== null && password_verify($password, $hash);
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
