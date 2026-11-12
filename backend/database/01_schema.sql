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
