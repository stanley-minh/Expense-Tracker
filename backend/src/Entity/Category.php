<?php

namespace App\Entity;

use App\Repository\CategoryRepository;
use ApiPlatform\Metadata\ApiResource;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

/**
 * Une catégorie de dépense (ex: "Alimentation", "Transport"), propre à un utilisateur.
 *
 * #[ApiResource] sans paramètre = CRUD REST complet généré par API Platform sur
 * /api/categories (GET collection, GET item, POST, PUT, PATCH, DELETE), sans
 * restriction de sécurité déclarée au niveau de la ressource : seule la règle
 * globale `IS_AUTHENTICATED_FULLY` de security.yaml s'applique (voir §8 point 2
 * de la documentation backend : rien n'empêche aujourd'hui un utilisateur connecté
 * de lire/modifier les catégories d'un autre utilisateur).
 */
#[ORM\Entity(repositoryClass: CategoryRepository::class)]
#[ApiResource]
class Category
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $name = null;

    /**
     * Propriétaire de la catégorie. Relation ManyToOne obligatoire (nullable: false) :
     * une catégorie ne peut pas exister sans utilisateur rattaché.
     */
    #[ORM\ManyToOne(inversedBy: 'categories')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    /**
     * Dépenses classées dans cette catégorie. Côté "inverse" de la relation
     * OneToMany/ManyToOne définie sur Expense::$category (mappedBy: 'category').
     *
     * @var Collection<int, Expense>
     */
    #[ORM\OneToMany(targetEntity: Expense::class, mappedBy: 'category')]
    private Collection $expenses;

    public function __construct()
    {
        $this->expenses = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

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

    /**
     * @return Collection<int, Expense>
     */
    public function getExpenses(): Collection
    {
        return $this->expenses;
    }

    /**
     * Rattache une dépense à cette catégorie en synchronisant les deux côtés de
     * la relation (comme User::addCategory()).
     */
    public function addExpense(Expense $expense): static
    {
        if (!$this->expenses->contains($expense)) {
            $this->expenses->add($expense);
            $expense->setCategory($this);
        }

        return $this;
    }

    public function removeExpense(Expense $expense): static
    {
        if ($this->expenses->removeElement($expense)) {
            // set the owning side to null (unless already changed)
            if ($expense->getCategory() === $this) {
                $expense->setCategory(null);
            }
        }

        return $this;
    }
}
