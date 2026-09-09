<?php
// tests/AuthenticationTest.php

namespace App\Tests;

use ApiPlatform\Symfony\Bundle\Test\ApiTestCase;

/**
 * Test fonctionnel bout-en-bout du flux d'authentification JWT décrit dans
 * BACKEND_DOCUMENTATION.md §4 : ApiTestCase boote un vrai kernel Symfony et
 * envoie de vraies requêtes HTTP internes (pas de mock), ce qui permet de
 * vérifier le firewall, le hachage/vérification du mot de passe et la
 * génération du JWT ensemble, comme un vrai client le ferait.
 */
class AuthenticationTest extends ApiTestCase
{
    // Force le (re)boot du kernel avant chaque test au lieu de le réutiliser :
    // nécessaire ici car le test dépend d'un état précis en base (l'utilisateur
    // test@example.com doit exister).
    protected static ?bool $alwaysBootKernel = true; // ajoute cette ligne

    public function testLoginThenAccessProtectedRoute(): void
    {
        $client = self::createClient();

        // On réutilise l'utilisateur de test déjà présent en base
        // (créé manuellement lors du diagnostic de l'issue #1)
        $response = $client->request('POST', '/api/login_check', [
            'headers' => ['Content-Type' => 'application/json'],
            'json' => [
                'username' => 'test@example.com',
                'password' => 'test1234',
            ],
        ]);

        $this->assertResponseStatusCodeSame(200);
        $token = $response->toArray()['token'];

        $client->request('GET', '/api/expenses', [
            'auth_bearer' => $token,
        ]);

        $this->assertResponseStatusCodeSame(200);
    }
}