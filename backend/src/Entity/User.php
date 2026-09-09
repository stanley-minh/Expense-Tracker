<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use App\Repository\UserRepository;
use App\State\UserPasswordHasher;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Compte utilisateur de l'application.
 *
 * Entité Doctrine ET utilisateur du système de sécurité Symfony à la fois
 * (elle implémente {@see UserInterface} et {@see PasswordAuthenticatedUserInterface}) :
 * c'est elle que Symfony charge pour authentifier une requête JWT et vérifier les rôles.
 *
 * Exposée en API REST via #[ApiResource] avec seulement 3 opérations autorisées
 * (contrairement à Category/Expense qui ont le CRUD complet par défaut) :
 * - GetCollection : liste des utilisateurs, réservée aux utilisateurs connectés (ROLE_USER).
 * - Get (item)     : consultation d'un utilisateur, réservée à l'utilisateur lui-même
 *                    (condition `object == user`, où `user` est injecté par API Platform
 *                    comme étant l'utilisateur authentifié de la requête courante).
 * - Post           : inscription, publique (voir access_control dans security.yaml),
 *                    déléguée au State Processor {@see UserPasswordHasher} qui hache
 *                    le mot de passe avant la sauvegarde.
 *
 * Il n'y a volontairement AUCUNE opération Put/Patch/Delete : on ne peut ni modifier
 * ni supprimer un utilisateur via l'API pour l'instant.
 *
 * normalizationContext / denormalizationContext restreignent les champs exposés en
 * lecture (groupe `user:read`) et acceptés en écriture (groupe `user:create`) via
 * les attributs #[Groups(...)] posés sur chaque propriété ci-dessous.
 */
#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ApiResource(
    operations: [
        new GetCollection(security: "is_granted('ROLE_USER')"),
        new Get(security: "is_granted('ROLE_USER') and object == user"),
        new Post(
            processor: UserPasswordHasher::class,
            validationContext: ['groups' => ['Default', 'user:create']],
        ),
    ],
    normalizationContext: ['groups' => ['user:read']],
    denormalizationContext: ['groups' => ['user:create']],
)]
#[ORM\UniqueConstraint(name: 'UNIQ_IDENTIFIER_EMAIL', fields: ['email'])]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[Groups(['user:read'])]
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    /**
     * Sert d'identifiant de connexion (voir getUserIdentifier()) en plus d'être
     * l'adresse email du compte. Doit rester unique (contrainte UNIQ_IDENTIFIER_EMAIL
     * ci-dessus).
     */
    #[Groups(['user:read', 'user:create'])]
    #[Assert\NotBlank]
    #[Assert\Email]
    #[ORM\Column(length: 180)]
    private ?string $email = null;

    /**
     * @var list<string> The user roles
     */
    #[Groups(['user:read'])]
    #[ORM\Column]
    private array $roles = [];

    /**
     * @var string The hashed password
     *
     * Aucun groupe volontairement : jamais exposé en lecture, jamais accepté en écriture directe.
     */
    #[ORM\Column]
    private ?string $password = null;

    /**
     * Mot de passe en clair, reçu uniquement à la création du compte (groupe
     * `user:create`) et jamais persisté tel quel : {@see UserPasswordHasher} le
     * transforme en hash puis le remet à null avant l'écriture en base. Les règles
     * de validation (NotBlank, longueur minimale 8) ne s'appliquent qu'au groupe
     * `user:create`, donc uniquement lors de l'inscription.
     */
    #[Groups(['user:create'])]
    #[Assert\NotBlank(groups: ['user:create'])]
    #[Assert\Length(min: 8, groups: ['user:create'])]
    private ?string $plainPassword = null;

    /**
     * @var Collection<int, Category>
     */
    #[ORM\OneToMany(targetEntity: Category::class, mappedBy: 'user')]
    private Collection $categories;

    /**
     * @var Collection<int, Expense>
     */
    #[ORM\OneToMany(targetEntity: Expense::class, mappedBy: 'user')]
    private Collection $expenses;

    /**
     * Initialise les collections Doctrine à vide : indispensable, sinon getCategories()/
     * getExpenses() renverraient null tant que l'entité n'a pas été rechargée depuis la base.
     */
    public function __construct()
    {
        $this->categories = new ArrayCollection();
        $this->expenses = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;

        return $this;
    }

    /**
     * A visual identifier that represents this user.
     *
     * @see UserInterface
     */
    public function getUserIdentifier(): string
    {
        return (string) $this->email;
    }

    /**
     * @see UserInterface
     */
    public function getRoles(): array
    {
        $roles = $this->roles;
        // guarantee every user at least has ROLE_USER
        $roles[] = 'ROLE_USER';

        return array_unique($roles);
    }

    /**
     * @param list<string> $roles
     */
    public function setRoles(array $roles): static
    {
        $this->roles = $roles;

        return $this;
    }

    /**
     * @see PasswordAuthenticatedUserInterface
     */
    public function getPassword(): ?string
    {
        return $this->password;
    }

    /**
     * Assigne directement le hash (jamais le mot de passe en clair — voir
     * setPlainPassword()). Utilisé par UserPasswordHasher et par
     * UserRepository::upgradePassword() lors du rehash automatique.
     */
    public function setPassword(string $password): static
    {
        $this->password = $password;

        return $this;
    }

    public function getPlainPassword(): ?string
    {
        return $this->plainPassword;
    }

    /**
     * Reçoit le mot de passe en clair envoyé par le client à l'inscription.
     * Ne jamais appeler getPlainPassword() après le passage dans
     * UserPasswordHasher::process() : la valeur y est remise à null par sécurité.
     */
    public function setPlainPassword(?string $plainPassword): static
    {
        $this->plainPassword = $plainPassword;

        return $this;
    }

    /**
     * @see UserInterface — appelé automatiquement par Symfony après authentification.
     * Le plainPassword est déjà effacé manuellement dans le State Processor,
     * donc rien à faire ici, mais la méthode reste requise par l'interface.
     */
    public function eraseCredentials(): void
    {
    }

    /**
     * Ensure the session doesn't contain actual password hashes by CRC32C-hashing them, as supported since Symfony 7.3.
     */
    public function __serialize(): array
    {
        $data = (array) $this;
        $data["\0".self::class."\0password"] = hash('crc32c', $this->password);

        return $data;
    }

    /**
     * @return Collection<int, Category>
     */
    public function getCategories(): Collection
    {
        return $this->categories;
    }

    /**
     * Ajoute une catégorie à cet utilisateur en maintenant les deux côtés de la
     * relation OneToMany/ManyToOne synchronisés (côté User ET côté Category) —
     * c'est le rôle habituel des méthodes add* / remove* sur le côté "inverse"
     * d'une relation Doctrine bidirectionnelle.
     */
    public function addCategory(Category $category): static
    {
        if (!$this->categories->contains($category)) {
            $this->categories->add($category);
            $category->setUser($this);
        }

        return $this;
    }

    public function removeCategory(Category $category): static
    {
        if ($this->categories->removeElement($category)) {
            if ($category->getUser() === $this) {
                $category->setUser(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Expense>
     */
    public function getExpenses(): Collection
    {
        return $this->expenses;
    }

    /**
     * Même logique de synchronisation bidirectionnelle que addCategory().
     */
    public function addExpense(Expense $expense): static
    {
        if (!$this->expenses->contains($expense)) {
            $this->expenses->add($expense);
            $expense->setUser($this);
        }

        return $this;
    }

    public function removeExpense(Expense $expense): static
    {
        if ($this->expenses->removeElement($expense)) {
            if ($expense->getUser() === $this) {
                $expense->setUser(null);
            }
        }

        return $this;
    }
}