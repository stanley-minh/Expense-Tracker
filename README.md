# Expense Tracker

A personal expense tracking application. Users record their expenses and
can view, create, edit or delete them (full CRUD).

This project is a monorepo: the backend and frontend live in the same
repository, in two separate folders.

> The first version of this project used Symfony + API Platform.
> It has been replaced by a hand-written PHP MVC backend (no framework),
> to understand what a framework does under the hood.

## Tech stack

- **Frontend**: React 19 + TypeScript (Vite), Tailwind CSS 4, daisyUI 5
- **Backend**: native PHP 8.5, MVC architecture, no framework, no Composer
- **Database**: MySQL 9.7 (LTS)
- **Infrastructure**: Docker Compose — nginx + PHP-FPM + MySQL

## Architecture

```
React (fetch) → nginx :8080 → PHP-FPM → Router → Controller → Model → MySQL
                                                     ↓
React  ←──────────────────── JSON (Response = the "View") ┘
```

## Project structure

```
Expense-Tracker/
├── compose.yaml          Docker services (nginx, php, database)
├── .env.example          environment template (copy to .env)
├── docker/
│   ├── php/Dockerfile    PHP-FPM image with pdo_mysql
│   └── nginx/default.conf
├── backend/
│   ├── public/index.php  front controller (single entry point)
│   ├── config/env.php    BDD_* constants read from .env
│   ├── database/         SQL run on the first MySQL start (schema, categories, seed)
│   │   └── migrations/   SQL to upgrade an existing database (run by hand)
│   └── src/
│       ├── Core/         Autoloader (PSR-4), Router, Response
│       ├── Utils/        Utils::connect() (shared PDO connection)
│       ├── Core/         + Auth (PHP session), HttpException
│       ├── Models/       Model (abstract), ModelExpense, ModelCategory, ModelUser
│       ├── Controllers/  Controller (abstract), ExpenseController, CategoryController,
│       │                 AuthController, AccountController
│       └── Validators/   ExpenseValidator, UserValidator
└── frontend/             React app (Vite)
    └── src/
        ├── api/          client.ts: typed fetch calls + error classes
        ├── auth/         AuthContext, AuthProvider, useAuth (logged-in user)
        ├── layouts/      ProtectedLayout (logged in), GuestLayout (login, register)
        ├── components/   MonthSummary, ExpenseForm, ExpenseList, ExpenseEditDialog,
        │                 RecentExpenses, Navbar, TextField
        ├── hooks/        useExpenses (loads expenses + categories, shared by the pages)
        ├── pages/        Home ("Saisie"), Recap ("Récapitulatif"), Login, Register, Account
        ├── types/        Expense, Category, ExpenseInput, User
        └── utils/        money (cents <-> euros), date
```

## Getting started

Requirements: Docker Desktop, Node.js.

```bash
# 1. Environment variables: copy, then fill in every empty value in .env
#    (database passwords AND the registration code given to the accountants)
cp .env.example .env

# 2. Backend + database
docker compose up -d --build

# 3. Frontend
cd frontend
npm install
npm run dev
```

- API: http://localhost:8080/api/expenses
- Frontend: http://localhost:5173 (Vite forwards `/api` to the PHP API, see `frontend/vite.config.ts`)
- MySQL (e.g. MySQL Workbench): host `127.0.0.1`, port `3307`, user/password from `.env`
- Demo account (development seed only): `demo@eglise.test` / `demo-password-2026`

### Upgrading an existing database

SQL files in `backend/database/` only run when the MySQL volume is empty.
To upgrade a database that already has data, run each file of
`backend/database/migrations/` once, in date order:

```bash
docker compose exec -T database sh -c 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' \
  < backend/database/migrations/2026_11_09_add_categories.sql
```

| Migration | Content |
| --- | --- |
| `2026_11_09_add_categories.sql` | categories (for a database created before the accounts feature) |
| `2026_11_12_add_participants_count.sql` | `expenses.participants_count` (keeps existing accounts and expenses) |

The accounts feature (users table, `expenses.user_id`) has no migration: the app
was not in production yet, so the development database is simply recreated
(`docker compose down -v && docker compose up -d`). From the first production
deployment on, every schema change will need a migration.

## Context

The app tracks the church's day-to-day expenses (shared meals, events,
hygiene, equipment). Larger expenses (building, legal...) are handled
by the accountant and are out of scope.

Each accountant has their own account and **only sees their own expenses**.
Once an expense has been analyzed, they check it as **validated**.

Pages (French interface):
- **Saisie** (`/`): month summary, entry form, last 5 entries.
- **Récapitulatif** (`/recap`): table of every expense with the "Validée"
  checkbox, edit and delete; filter tabs *Toutes / À valider / Validées*,
  kept in the URL (`/recap?statut=a-valider`).
- **Mon compte** (`/account`), **Connexion** (`/login`), **Créer un compte** (`/register`).

**Language**: the code, comments and documentation are in English; everything
shown to users (interface, API error messages, category names) is in French.

## Data model

- **categories** (reference data, `02_categories.sql`):

  | slug           | name (displayed) |
  | -------------- | ---------------- |
  | `agape`        | Agape            |
  | `event`        | Évènement        |
  | `hygiene`      | Hygiène          |
  | `equipment`    | Matériel         |
  | `other`        | Autre            |

- **users**: name, email (unique, lowercase), `password_hash` (bcrypt via
  `password_hash()`, the password itself is never stored)
- **expenses**: owner (`user_id`, foreign key, `ON DELETE CASCADE`), label,
  category (foreign key), `category_detail` (free text, required only with the
  `other` category), amount in cents, `participants_count` (number of people
  the expense is shared between, 1 to 1000, default 1), date,
  `is_validated` + `validated_at`

## Authentication

- **PHP session**: after login, the server keeps the user id in `$_SESSION` and
  the browser only holds a random session id in an `HttpOnly`, `SameSite=Lax`
  cookie (`expense_session`). No token is stored in JavaScript.
- **Registration** requires the `REGISTRATION_CODE` from `.env` (given by the
  church). Empty code = registrations closed (`403`).
- **Passwords**: 12 characters minimum, 72 bytes maximum (bcrypt limit).
- **Login** answers the same message, in the same time, whether the email
  exists or not (no account enumeration).
- Editing or deleting an account requires the current password. Deleting an
  account deletes all its expenses.

## API

Public routes:

| Method | Route                | Description                          | Success       |
| ------ | -------------------- | ------------------------------------ | ------------- |
| POST   | `/api/auth/register` | Create an account (+ log in)         | `201`         |
| POST   | `/api/auth/login`    | Log in                               | `200`         |
| POST   | `/api/auth/logout`   | Log out                              | `204`         |
| GET    | `/api/auth/me`       | Logged-in user (`401` if none)       | `200`         |
| GET    | `/api/categories`    | List the categories                  | `200`         |

Routes for a logged-in user (`401` otherwise), on **their own data only**
(another user's expense answers `404`):

| Method | Route                | Description                  | Success              |
| ------ | -------------------- | ---------------------------- | -------------------- |
| PUT    | `/api/account`       | Edit name / email / password (`current_password` required) | `200` |
| DELETE | `/api/account`       | Delete the account and its expenses (`password` required)  | `204` |
| GET    | `/api/expenses`      | List all expenses            | `200`                |
| GET    | `/api/expenses/{id}` | Get one expense              | `200`                |
| POST   | `/api/expenses`      | Create an expense            | `201` + `Location`   |
| PUT    | `/api/expenses/{id}` | Replace an expense (all fields) | `200`             |
| DELETE | `/api/expenses/{id}` | Delete an expense            | `204` (empty body)   |
| PATCH  | `/api/expenses/{id}/validation` | Check / uncheck "validated": `{"is_validated": true}` | `200` |

Request body (POST / PUT):

```json
{ "label": "Repas partagé", "category_id": 2, "category_detail": null, "amount_cents": 4250, "participants_count": 25, "spent_at": "2026-11-02" }
```

Errors: `400` body is not a JSON object · `401` not logged in ·
`403` registrations closed · `404` unknown id or route ·
`405` method not allowed on this route · `422` invalid values, e.g.
`{"errors": {"category_detail": "Précisez la catégorie."}}`

With the `other` category (Autre), `category_detail` is required, e.g.
`"category_id": 6, "category_detail": "Décoration"`. With any other category,
`category_detail` is ignored and stored as `null`.

`participants_count` is optional (default `1`). The interface splits the
amount to the exact cent: 100,00 € for 3 people gives
`1 × 33,34 € + 2 × 33,33 €` (Euclidean division, see `frontend/src/utils/money.ts`).

Amounts are stored and returned in **cents** (`amount_cents`, integer) to
avoid floating-point rounding errors. A single expense is limited to
**€10,000.00** (`1000000` cents).

## Current status

- [x] Docker stack (nginx, PHP-FPM, MySQL)
- [x] MVC core: autoloader, router, JSON response
- [x] Read expenses from MySQL
- [x] Tailwind CSS + daisyUI setup
- [x] Full CRUD (POST, PUT, DELETE, routes with parameters, validation)
- [x] Expense categories (Agape, Évènement, Hygiène, Matériel, Autre + free text)
- [x] React frontend: month summary, add form (French UI), expense list, delete
- [x] Edit an expense from the interface (dialog)
- [x] Accounts: registration with a code, login (PHP session), edit and delete account
- [x] Each accountant only sees their own expenses
- [x] Validation checkbox on expenses
- [x] Split an expense between several people (exact to the cent)
- [x] Two pages: "Saisie" (entry form) and "Récapitulatif" (table to validate, filter by status)
- [ ] Login rate limiting (Redis)
- [ ] Redis (cache, login rate limiting)
- [ ] Production deployment (VPS, HTTPS, CI/CD)
