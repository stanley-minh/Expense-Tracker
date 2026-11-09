-- backend/database/01_schema.sql
-- Database structure. Runs automatically on the FIRST start of the MySQL
-- container (empty volume). Files run in alphabetical order: 01_, 02_, 03_...
-- Sub-folders (like migrations/) are ignored by the MySQL image.

-- The file contains accents (é, è...): tell the mysql client the file is UTF-8,
-- otherwise it may read it with another encoding and store "Ã©" instead of "é".
SET NAMES utf8mb4;

-- Expense categories (contribution, agape, event, hygiene, equipment, other).
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
    label         VARCHAR(255)     NOT NULL,
    category_id   TINYINT UNSIGNED NOT NULL,      -- same type as categories.id (required for a foreign key)
    category_detail VARCHAR(100)   NULL,          -- free text, only for the "other" category ("Autre : ...")
    amount_cents  INT UNSIGNED     NOT NULL,      -- cents (integer): no float rounding errors
    spent_at      DATE             NOT NULL,
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

    INDEX idx_expenses_spent_at (spent_at)        -- monthly filters in O(log n)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
