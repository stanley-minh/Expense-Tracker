<?php
// tests/AuthenticationTest.php

namespace App\Tests;

use ApiPlatform\Symfony\Bundle\Test\ApiTestCase;

/**
 * Test fonctionnel bout-en-bout du flux d'authentification JWT : 
 * inscription -> connexion -> accès à une route protégée.
 *
 * ApiTestCase boote un vrai kernel Symfony et envoie de vraies requêtes HTTP
 * internes (pas de mock) : on vérifie ensemble le firewall, le hachage du mot
 * de passe et la génération du JWT, comme le ferait le frontend.
 *
 * Le test crée lui-même son utilisateur : il ne dépend d'aucune donnée
 * préexistante en base (principe F.I.R.S.T. : Independent + Repeatable).
 */
class AuthenticationTest extends ApiTestCase
{
    // Reboote le kernel avant chaque test : chaque test part d'un état propre.
    protected static ?bool $alwaysBootKernel = true;

    public function testRegisterThenLoginThenAccessProtectedRoute(): void
    {
        $client = self::createClient();

        // --- Arrange : créer un utilisateur via la vraie route d'inscription ---
        // uniqid() garantit un email différent à chaque exécution : la base de test
        // n'est pas vidée entre deux lancements, un email fixe provoquerait une
        // erreur "email déjà utilisé" dès le 2e lancement.
        $email = 'user_' . uniqid() . '@example.com';
        $password = 'password123'; // >= 8 caractères (Assert\Length sur plainPassword)

        $client->request('POST', '/api/users', [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => [
                'email' => $email,
                'plainPassword' => $password,
            ],
        ]);
        $this->assertResponseStatusCodeSame(201); // 201 Created

        // --- Act : se connecter avec cet utilisateur ---
        // La clé doit être "email" : c'est le username_path de security.yaml.
        $response = $client->request('POST', '/api/login_check', [
            'headers' => ['Content-Type' => 'application/json'],
            'json' => [
                'email' => $email,
                'password' => $password,
            ],
        ]);

        // --- Assert : on reçoit un token, et il ouvre une route protégée ---
        $this->assertResponseStatusCodeSame(200);
        $token = $response->toArray()['token'];
        $this->assertNotEmpty($token);

        $client->request('GET', '/api/expenses', [
            'auth_bearer' => $token, // ajoute l'en-tête "Authorization: Bearer <token>"
        ]);
        $this->assertResponseStatusCodeSame(200);
    }
}