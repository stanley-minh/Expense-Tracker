<?php
// tests/ExpenseOwnershipTest.php

namespace App\Tests;

use ApiPlatform\Symfony\Bundle\Test\ApiTestCase;
use ApiPlatform\Symfony\Bundle\Test\Client;
use App\Entity\Category;
use App\Entity\Expense;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Tests d'isolation des données : un utilisateur ne doit JAMAIS pouvoir accéder
 * aux dépenses d'un autre utilisateur (faille IDOR, OWASP A01 Broken Access Control).
 *
 * Scénario d'attaque : Bob, utilisateur légitime connecté, devine ou énumère
 * l'id d'une dépense d'Alice et tente de la lire.
 */
class ExpenseOwnershipTest extends ApiTestCase
{
    protected static ?bool $alwaysBootKernel = true;

    public function testUserCannotReadAnotherUsersExpense(): void
    {
        $client = self::createClient();

        // --- Arrange (1/2) : Alice et sa dépense, insérées directement en base ---
        $em = static::getContainer()->get(EntityManagerInterface::class);

        $alice = (new User())
            ->setEmail('alice_' . bin2hex(random_bytes(8)) . '@example.com')
            ->setPassword('unused'); // Alice ne se connecte jamais dans ce test

        $category = (new Category())
            ->setName('Food')
            ->setUser($alice);

        $expense = (new Expense())
            ->setAmount('42.50') // string : colonne DECIMAL (voir Expense::$amount)
            ->setDate(new \DateTimeImmutable())
            ->setCategory($category)
            ->setUser($alice);

        $em->persist($alice);
        $em->persist($category);
        $em->persist($expense);
        $em->flush(); // exécute les INSERT : $expense a maintenant un id

        // --- Arrange (2/2) : Bob, l'attaquant, obtient un vrai token ---
        $bobToken = $this->registerAndLogin($client);

        // --- Act : Bob tente de lire la dépense d'Alice ---
        $client->request('GET', '/api/expenses/' . $expense->getId(), [
            'auth_bearer' => $bobToken,
        ]);

        // --- Assert : accès refusé ---
        $this->assertResponseStatusCodeSame(403);
    }

    /**
     * Crée un compte via la vraie route d'inscription, puis s'y connecte.
     *
     * @return string Le token JWT de l'utilisateur créé.
     */
    private function registerAndLogin(Client $client): string
    {
        $email = 'user_' . bin2hex(random_bytes(8)) . '@example.com';
        $password = 'password123';

        $client->request('POST', '/api/users', [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => ['email' => $email, 'plainPassword' => $password],
        ]);
        $this->assertResponseStatusCodeSame(201);

        $response = $client->request('POST', '/api/login_check', [
            'headers' => ['Content-Type' => 'application/json'],
            'json' => ['email' => $email, 'password' => $password],
        ]);
        $this->assertResponseStatusCodeSame(200);

        return $response->toArray()['token'];
    }
}