-- backend/database/migrations/2026_11_19_add_expense_participants.sql
-- Migration: replaces expenses.participants_count by a table of named participants.
--
-- WARNING: the existing participants_count values are lost (a number cannot be
-- turned into names). Acceptable here: the app is not in production yet.
-- Existing accounts and expenses are kept.
--
-- Run once:
--   docker compose exec -T database sh -c 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' \
--     < backend/database/migrations/2026_11_19_add_expense_participants.sql

SET NAMES utf8mb4;

-- 1. New table (same definition as in 01_schema.sql)
CREATE TABLE IF NOT EXISTS expense_participants (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    expense_id  INT UNSIGNED NOT NULL,
    name        VARCHAR(100) NOT NULL,
    has_paid    BOOLEAN      NOT NULL DEFAULT FALSE,
    paid_at     DATETIME     NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_participant_name_not_empty CHECK (name <> ''),
    CONSTRAINT uq_participants_expense_name UNIQUE (expense_id, name),
    CONSTRAINT fk_participants_expense FOREIGN KEY (expense_id)
        REFERENCES expenses (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Old column: the CHECK constraint that uses it first, then the column itself
ALTER TABLE expenses DROP CHECK chk_participants_range;
ALTER TABLE expenses DROP COLUMN participants_count;
