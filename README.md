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
│       ├── Models/       Model (abstract), ModelExpense, ModelCategory
│       ├── Controllers/  Controller (abstract), ExpenseController, CategoryController
│       └── Validators/   ExpenseValidator
└── frontend/             React app (Vite)
```

## Getting started

Requirements: Docker Desktop, Node.js.

```bash
# 1. Environment variables (then set real passwords in .env)
cp .env.example .env

# 2. Backend + database
docker compose up -d --build

# 3. Frontend
cd frontend
npm install
npm run dev
```

- API: http://localhost:8080/api/expenses
- Frontend: http://localhost:5173
- MySQL (e.g. MySQL Workbench): host `127.0.0.1`, port `3307`, user/password from `.env`

### Upgrading an existing database

SQL files in `backend/database/` only run when the MySQL volume is empty.
To upgrade a database that already has data, run each file of
`backend/database/migrations/` once, in date order:

```bash
docker compose exec -T database sh -c 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' \
  < backend/database/migrations/2026_11_09_add_categories.sql
```

## Context

The app tracks the church's day-to-day expenses (shared meals, events,
hygiene, equipment). Larger expenses (building, legal...) are handled
by the accountant and are out of scope.

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

- **expenses**: label, category (foreign key), `category_detail` (free text,
  required only with the `other` category), amount in cents, date

## API

| Method | Route                | Description                  | Success              |
| ------ | -------------------- | ---------------------------- | -------------------- |
| GET    | `/api/expenses`      | List all expenses            | `200`                |
| GET    | `/api/expenses/{id}` | Get one expense              | `200`                |
| POST   | `/api/expenses`      | Create an expense            | `201` + `Location`   |
| PUT    | `/api/expenses/{id}` | Replace an expense (all fields) | `200`             |
| DELETE | `/api/expenses/{id}` | Delete an expense            | `204` (empty body)   |
| GET    | `/api/categories`    | List the categories          | `200`                |

Request body (POST / PUT):

```json
{ "label": "Repas partagé", "category_id": 2, "category_detail": null, "amount_cents": 4250, "spent_at": "2026-11-02" }
```

Errors: `400` body is not a JSON object · `404` unknown id or route ·
`405` method not allowed on this route · `422` invalid values, e.g.
`{"errors": {"category_detail": "Précisez la catégorie."}}`

With the `other` category (Autre), `category_detail` is required, e.g.
`"category_id": 6, "category_detail": "Décoration"`. With any other category,
`category_detail` is ignored and stored as `null`.

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
- [ ] Connect React to the API
- [ ] Authentication
- [ ] Redis (cache, login rate limiting)
- [ ] Production deployment (VPS, HTTPS, CI/CD)
