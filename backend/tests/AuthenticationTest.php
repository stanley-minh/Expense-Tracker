<?php
// tests/AuthenticationTest.php

namespace App\Tests;

use ApiPlatform\Symfony\Bundle\Test\ApiTestCase;

class AuthenticationTest extends ApiTestCase
{
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