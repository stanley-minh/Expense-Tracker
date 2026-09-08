<?php
// src/State/UserPasswordHasher.php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\User;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * @implements ProcessorInterface<User, User>
 *
 * Hash le mot de passe en clair avant la persistance de l'utilisateur.
 * S'intercale entre la validation des données et la sauvegarde Doctrine.
 */
final readonly class UserPasswordHasher implements ProcessorInterface
{
    public function __construct(
        private ProcessorInterface $persistProcessor,
        private UserPasswordHasherInterface $passwordHasher,
    ) {
    }

    /**
     * @param User $data
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        if ($data->getPlainPassword()) {
            $hashedPassword = $this->passwordHasher->hashPassword(
                $data,
                $data->getPlainPassword(),
            );
            $data->setPassword($hashedPassword);
            $data->setPlainPassword(null); // efface le mot de passe en clair de la mémoire dès qu'il n'est plus utile
        }

        return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
    }
}