<?php

namespace App;

use Symfony\Bundle\FrameworkBundle\Kernel\MicroKernelTrait;
use Symfony\Component\HttpKernel\Kernel as BaseKernel;

/**
 * Point d'entrée du framework Symfony pour cette application.
 *
 * MicroKernelTrait : place toute la configuration (bundles, routes) dans les
 * fichiers de config/ standards (bundles.php, routes/, packages/) plutôt que
 * dans cette classe — c'est le kernel "micro" généré par défaut par Symfony
 * Flex, à ne modifier que pour des besoins très spécifiques au bootstrap
 * (ce qui n'est pas le cas ici : seule la liste des environnements autorisés
 * est surchargée).
 */
class Kernel extends BaseKernel
{
    use MicroKernelTrait;

    /**
     * Restreint APP_ENV aux trois environnements réellement gérés par ce
     * projet (voir .env, .env.dev, .env.test) : une valeur en dehors de cette
     * liste fait échouer le boot du kernel plutôt que de charger une config
     * inattendue.
     *
     * @return list<string> An array of allowed values for APP_ENV
     */
    private function getAllowedEnvs(): array
    {
        return ['prod', 'dev', 'test'];
    }
}
