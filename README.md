# Expense Tracker

A personal expense tracking application: each user creates an account,
organizes their expenses into categories, and can view, create, edit or
delete them (full CRUD).

This project is a monorepo: the backend and frontend live in the same
repository, in two separate folders.

## Tech stack

- **Backend**: Symfony 8 (PHP 8.5)
- **API**: API Platform (REST API generated automatically from Doctrine entities)
- **Database**: MySQL 8.0
- **Authentication**: JWT (LexikJWTAuthenticationBundle)
- **CORS**: NelmioCorsBundle
- **Frontend** (coming soon): React (Vite)

## Project structure

```
suivi-depenses/
├── backend/          Symfony + API Platform (REST API)
│   ├── src/
│   │   ├── Entity/       User.php, Category.php, Expense.php
│   │   └── Repository/   associated Doctrine repositories
│   ├── config/
│   │   ├── packages/     api_platform.yaml, security.yaml, ...
│   │   └── routes/       api_platform.yaml, lexik_jwt_authentication.yaml
│   └── public/index.php  server entry point
└── frontend/         React (Vite) — to be built
```

## Data model

- **User**: user account (email, hashed password, roles). Has many
  categories and many expenses.
- **Category**: an expense category (e.g. "Food", "Transport"). Belongs to
  a user, groups several expenses.
- **Expense**: a single expense (amount, description, date). Belongs to a
  category and a user.

## Setup (backend)

Requirements: PHP 8.5, Composer, MySQL 8.

```bash
cd backend
composer install
```

Configure the database in `backend/.env.local` (not versioned):

```
DATABASE_URL="mysql://root:@127.0.0.1:3306/suivi_depenses?serverVersion=8.0"
```

Create the database and run the migrations:

```bash
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate
```

Generate the JWT key pair (one-time setup):

```bash
php bin/console lexik:jwt:generate-keypair
```

Start the development server:

```bash
php -S 127.0.0.1:8000 -t public
```

The API is then available at `http://127.0.0.1:8000/api`, with interactive
documentation (Swagger UI) at the root.

## Authentication

Log in via `POST /api/login_check` with a JSON body
`{"username": "email@example.com", "password": "..."}`, which returns a JWT
token. That token must then be sent in the `Authorization: Bearer <token>`
header to access protected API routes.

## Current status

- [x] Symfony backend + API Platform working
- [x] User / Category / Expense entities created and migrated
- [x] JWT authentication (login + protected routes)
- [x] User registration endpoint
- [ ] React frontend

## Next project

A second project, using React + NestJS, is planned to compare both backend
approaches.
