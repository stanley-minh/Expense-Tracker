-- backend/database/01_schema.sql
-- Database structure. Runs automatically on the FIRST start of the MySQL
-- container (empty volume). Files run in alphabetical order: 01_, 02_, 03_...
-- Sub-folders (like migrations/) are ignored by the MySQL image.

-- The file contains accents (é, è...): tell the mysql client the file is UTF-8,
-- otherwise it may read it with another encoding and store "Ã©" instead of "é".
SET NAMES utf8mb4;

-- Accounts of the accountants. Each one only sees their own expenses.
CREATE TABLE IF NOT EXISTS users (
    id             INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(100) NOT NULL,
    email          VARCHAR(255) NOT NULL,           -- stored in lowercase (normalized by PHP)
    -- Output of password_hash(): bcrypt today (60 characters); 255 leaves room
    -- for a future, longer algorithm. The real password is NEVER stored.
    password_hash  VARCHAR(255) NOT NULL,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_users_email UNIQUE (email),       -- one account per email
    CONSTRAINT chk_users_name_not_empty CHECK (name <> '')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expense categories (agape, event, hygiene, equipment, other).
-- A separate table rather than a fixed list in the code: a new category
-- can be added later with one INSERT, without touching the PHP code.
CREATE TABLE IF NOT EXISTS categories (
    id    TINYINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, -- 1 byte: up to 255 categories
    slug  VARCHAR(50)      NOT NULL,                            -- stable technical code, in English ("agape")
    name  VARCHAR(100)     NOT NULL,                            -- label displayed in the app, in French ("Agape")

    CONSTRAINT uq_categories_slug UNIQUE (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS expenses (
    id            INT UNSIGNED     NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id       INT UNSIGNED     NOT NULL,      -- owner: the accountant who entered the expense
    label         VARCHAR(255)     NOT NULL,
    category_id   TINYINT UNSIGNED NOT NULL,      -- same type as categories.id (required for a foreign key)
    category_detail VARCHAR(100)   NULL,          -- free text, only for the "other" category ("Autre : ...")
    amount_cents  INT UNSIGNED     NOT NULL,      -- cents (integer): no float rounding errors
    -- No participants_count column: the number of people is COUNT(*) of the
    -- expense_participants rows. Storing it too would create two sources of truth.
    spent_at      DATE             NOT NULL,
    -- BOOLEAN is an alias of TINYINT(1) in MySQL: 0 = false, 1 = true
    is_validated  BOOLEAN          NOT NULL DEFAULT FALSE,
    validated_at  DATETIME         NULL,          -- when it was validated (NULL if not validated)
    created_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Defense in depth: the database itself rejects invalid data
    CONSTRAINT chk_label_not_empty CHECK (label <> ''),
    CONSTRAINT chk_category_detail_not_empty CHECK (category_detail IS NULL OR category_detail <> ''),
    -- Business rule: one expense is between 0.01 € and 10,000.00 € (1,000,000 cents)
    CONSTRAINT chk_amount_range CHECK (amount_cents BETWEEN 1 AND 1000000),

    -- Foreign key: category_id must exist in categories.id.
    -- RESTRICT: a category that still has expenses cannot be deleted.
    CONSTRAINT fk_expenses_category FOREIGN KEY (category_id)
        REFERENCES categories (id) ON DELETE RESTRICT,

    -- CASCADE: deleting an account also deletes all its expenses
    CONSTRAINT fk_expenses_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,

    -- Composite index: every query is "WHERE user_id = ? ORDER BY spent_at",
    -- so one B-tree sorted by (user_id, then spent_at) answers both parts at once.
    -- It also serves the foreign key on user_id (its leftmost column).
    INDEX idx_expenses_user_spent_at (user_id, spent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- People who share an expense, and whether they have paid their share.
-- One-to-many relation: one expense has 0..n participants, a participant belongs
-- to exactly one expense (Merise: EXPENSE (0,n) —— (1,1) PARTICIPANT).
--
-- The share amount is NOT stored: it is computed from expenses.amount_cents and
-- the number of participants (Euclidean division, see ModelExpense::withShares).
-- Stored, it would become wrong as soon as the amount or the list changes.
--
-- Personal data (GDPR): only a first name, never more than needed.
CREATE TABLE IF NOT EXISTS expense_participants (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    expense_id  INT UNSIGNED NOT NULL,             -- same type as expenses.id (required for a foreign key)
    name        VARCHAR(100) NOT NULL,             -- first name (+ initial), e.g. "Marie D."
    has_paid    BOOLEAN      NOT NULL DEFAULT FALSE,
    paid_at     DATETIME     NULL,                 -- when the payment was checked (NULL if not paid)
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_participant_name_not_empty CHECK (name <> ''),

    -- The same person cannot appear twice on the same expense.
    -- The column collation (utf8mb4_unicode_ci) ignores case AND accents:
    -- "Léa", "lea" and "LEA" are the same name for this constraint.
    -- This UNIQUE index also serves the foreign key (expense_id is its leftmost column).
    CONSTRAINT uq_participants_expense_name UNIQUE (expense_id, name),

    -- CASCADE: participants have no meaning without their expense,
    -- deleting the expense deletes its participants.
    CONSTRAINT fk_participants_expense FOREIGN KEY (expense_id)
        REFERENCES expenses (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
