# Suivi de dépenses

Application de suivi de dépenses personnelles : chaque utilisateur crée un
compte, organise ses dépenses par catégories, et peut les consulter, créer,
modifier ou supprimer (CRUD complet).

Ce projet est un monorepo : le backend et le frontend vivent dans le même
dépôt, dans deux dossiers séparés.

## Stack technique

- **Backend** : Symfony 8 (PHP 8.5)
- **API** : API Platform (API REST générée automatiquement à partir des entités Doctrine)
- **Base de données** : MySQL 8.0
- **Authentification** : JWT (LexikJWTAuthenticationBundle)
- **CORS** : NelmioCorsBundle
- **Frontend** (à venir) : React (Vite)

## Structure du projet

```
suivi-depenses/
├── backend/          Symfony + API Platform (API REST)
│   ├── src/
│   │   ├── Entity/       User.php, Category.php, Expense.php
│   │   └── Repository/   dépôts Doctrine associés
│   ├── config/
│   │   ├── packages/     api_platform.yaml, security.yaml, ...
│   │   └── routes/       api_platform.yaml, lexik_jwt_authentication.yaml
│   └── public/index.php  point d'entrée du serveur PHP
└── frontend/         React (Vite) — à construire
```

## Modèle de données

- **User** : compte utilisateur (email, mot de passe haché, rôles). Possède
  plusieurs catégories et plusieurs dépenses.
- **Category** : catégorie de dépense (ex. "Alimentation", "Transport").
  Appartient à un utilisateur, regroupe plusieurs dépenses.
- **Expense** : une dépense (montant, description, date). Appartient à une
  catégorie et à un utilisateur.

## Installation (backend)

Prérequis : PHP 8.5, Composer, MySQL 8.

```bash
cd backend
composer install
```

Configurer la base de données dans `backend/.env.local` (fichier non versionné) :

```
DATABASE_URL="mysql://root:@127.0.0.1:3306/suivi_depenses?serverVersion=8.0"
```

Créer la base et jouer les migrations :

```bash
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate
```

Générer les clés JWT (une seule fois) :

```bash
php bin/console lexik:jwt:generate-keypair
```

Lancer le serveur de développement :

```bash
php -S 127.0.0.1:8000 -t public
```

L'API est alors disponible sur `http://127.0.0.1:8000/api`, avec la
documentation interactive (Swagger UI) à la racine.

## Authentification

Connexion via `POST /api/login_check` avec un corps JSON
`{"username": "email@exemple.com", "password": "..."}`, qui renvoie un token
JWT. Ce token doit ensuite être envoyé dans l'en-tête
`Authorization: Bearer <token>` pour accéder aux routes protégées de l'API.

## État actuel

- [x] Backend Symfony + API Platform fonctionnel
- [x] Entités User / Category / Expense créées et migrées
- [x] Authentification JWT (connexion + protection des routes)
- [ ] Endpoint d'inscription utilisateur
- [ ] Frontend React

## Projet suivant

Un second projet, utilisant React + NestJS, est prévu pour comparer les deux
approches backend.
