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
│   ├── database/         SQL run on the first MySQL start (schema, seed)
│   └── src/
│       ├── Core/         Autoloader (PSR-4), Router, Response
│       ├── Utils/        Utils::connect() (shared PDO connection)
│       ├── Models/       Model (abstract), ModelExpense
│       └── Controllers/  Controller (abstract), ExpenseController
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

## API

| Method | Route           | Description       |
| ------ | --------------- | ----------------- |
| GET    | `/api/expenses` | List all expenses |

Amounts are stored and returned in **cents** (`amount_cents`, integer) to
avoid floating-point rounding errors.

## Current status

- [x] Docker stack (nginx, PHP-FPM, MySQL)
- [x] MVC core: autoloader, router, JSON response
- [x] Read expenses from MySQL
- [x] Tailwind CSS + daisyUI setup
- [ ] Full CRUD (POST, PUT, DELETE, routes with parameters)
- [ ] Connect React to the API
- [ ] Authentication
- [ ] Redis (cache, login rate limiting)
- [ ] Production deployment (VPS, HTTPS, CI/CD)
