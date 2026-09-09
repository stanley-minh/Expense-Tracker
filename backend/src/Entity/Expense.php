<?php

namespace App\Entity;

use App\Repository\ExpenseRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use ApiPlatform\Metadata\ApiResource;

/**
 * Une dépense unitaire : montant, description optionnelle, date, rattachée à
 * une catégorie et à un utilisateur.
 *
 * Comme Category, #[ApiResource] sans paramètre expose le CRUD complet sur
 * /api/expenses sans restriction de sécurité propre à la ressource — même
 * remarque que sur Category concernant l'absence d'isolement par utilisateur.
 */
#[ORM\Entity(repositoryClass: ExpenseRepository::class)]
#[ApiResource]
class Expense
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    /**
     * Stocké en DECIMAL(10,2) côté base (Types::DECIMAL) mais typé `string` côté
     * PHP : c'est volontaire, Doctrine ne mappe jamais un DECIMAL sur `float` par
     * défaut pour éviter les erreurs d'arrondi propres aux flottants sur des montants
     * d'argent. Convertir en float/Money uniquement au moment du calcul, jamais
     * pour le stockage.
     */
    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    private ?string $amount = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $description = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $date = null;

    /**
     * NOTE : le type est écrit `?category` (minuscule) au lieu de `?Category`.
     * PHP ne distingue pas la casse des noms de classe donc ça fonctionne, mais
     * c'est trompeur à la relecture — à corriger en `?Category` pour matcher le
     * vrai nom de la classe (voir §8 de BACKEND_DOCUMENTATION.md).
     */
    #[ORM\ManyToOne(inversedBy: 'expenses')]
    #[ORM\JoinColumn(nullable: false)]
    private ?category $category = null;

    #[ORM\ManyToOne(inversedBy: 'expenses')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    /**
     * @return string|null Le montant en chaîne décimale (ex: "42.50"), jamais un float.
     */
    public function getAmount(): ?string
    {
        return $this->amount;
    }

    public function setAmount(string $amount): static
    {
        $this->amount = $amount;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function getDate(): ?\DateTimeImmutable
    {
        return $this->date;
    }

    public function setDate(\DateTimeImmutable $date): static
    {
        $this->date = $date;

        return $this;
    }

    public function getCategory(): ?category
    {
        return $this->category;
    }

    public function setCategory(?category $category): static
    {
        $this->category = $category;

        return $this;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }
}
