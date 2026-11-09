-- backend/database/01_schema.sql
-- Database structure. Runs automatically on the FIRST start of the MySQL
-- container (empty volume). Files run in alphabetical order: 01_ before 02_.

CREATE TABLE IF NOT EXISTS expenses (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    label         VARCHAR(255) NOT NULL,
    amount_cents  INT UNSIGNED NOT NULL,          -- cents (integer): no float rounding errors
    spent_at      DATE         NOT NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Defense in depth: the database itself rejects invalid data
    CONSTRAINT chk_label_not_empty CHECK (label <> ''),
    -- Business rule: one expense is between 0.01 € and 1,000.00 € (100,000 cents)
    CONSTRAINT chk_amount_range CHECK (amount_cents BETWEEN 1 AND 100000),

    INDEX idx_expenses_spent_at (spent_at)        -- monthly filters in O(log n)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
