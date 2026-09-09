<?php
// src/State/UserPasswordHasher.php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\User;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * State Processor API Platform déclaré sur l'opération Post de {@see User}
 * (voir l'attribut #[ApiResource] de User.php, paramètre `processor`).
 *
 * Rôle : hacher le mot de passe en clair avant la persistance de l'utilisateur.
 * S'intercale entre la validation des données (déjà faite par API Platform à ce
 * stade, via les contraintes #[Assert\...] du groupe `user:create`) et la
 * sauvegarde Doctrine.
 *
 * Pattern Decorator : `$persistProcessor` est le processor de persistance par
 * défaut d'API Platform (celui qui fait le vrai `$em->persist()` / `flush()`).
 * On ne le remplace pas, on s'exécute juste avant lui puis on lui délègue le
 * travail — c'est la façon idiomatique d'ajouter une étape dans le pipeline
 * d'écriture d'API Platform sans réécrire la persistance.
 *
 * @implements ProcessorInterface<User, User>
 */
final readonly class UserPasswordHasher implements ProcessorInterface
{
    public function __construct(
        private ProcessorInterface $persistProcessor,
        private UserPasswordHasherInterface $passwordHasher,
    ) {
    }

    /**
     * @param User $data L'entité User désérialisée depuis le JSON de la requête,
     *                    pas encore persistée.
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