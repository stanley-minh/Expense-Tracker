<?php

namespace App\Models;

use PDO;

/**
 * Data access for the "categories" table
 * (Cotisation, Agape, Évènement, Hygiène, Matériel, Autre).
 */
final class ModelCategory extends Model
{
    /**
     * Returns every category, alphabetically, with "other" (Autre) always last.
     *
     * ORDER BY slug = 'other': the comparison gives 0 (false) or 1 (true),
     * so every regular category (0) comes before "other" (1);
     * then "name" sorts alphabetically inside each group.
     *
     * @return list<array{id: int, slug: string, name: string}>
     */
    public function findAll(): array
    {
        $req = $this->getBdd()->prepare(
            "SELECT id, slug, name FROM categories ORDER BY slug = 'other', name"
        );
        $req->execute();

        return $req->fetchAll();
    }

    /**
     * Returns every category as an id => slug map, e.g. [1 => 'contribution', 6 => 'other'].
     * Used by the validator: it needs to know which ids exist AND which one is "other".
     *
     * @return array<int, string>
     */
    public function findSlugsById(): array
    {
        $req = $this->getBdd()->prepare('SELECT id, slug FROM categories');
        $req->execute();

        // FETCH_KEY_PAIR: first column becomes the key, second column the value
        return $req->fetchAll(PDO::FETCH_KEY_PAIR);
    }
}
