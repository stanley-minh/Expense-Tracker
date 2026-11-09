-- backend/database/migrations/2026_11_09_add_categories.sql
-- Migration: adds categories to an EXISTING database (one that already has data).
-- A fresh database does not need it: 01_schema.sql already contains everything.
--
-- Run once:
--   docker compose exec -T database sh -c 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' \
--     < backend/database/migrations/2026_11_09_add_categories.sql

-- The file contains accents (é, è...): tell the mysql client the file is UTF-8,
-- otherwise it may read it with another encoding and store "Ã©" instead of "é".
SET NAMES utf8mb4;

-- 1. New table + reference data
CREATE TABLE IF NOT EXISTS categories (
    id    TINYINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    slug  VARCHAR(50)      NOT NULL,
    name  VARCHAR(100)     NOT NULL,
    CONSTRAINT uq_categories_slug UNIQUE (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO categories (slug, name) VALUES
    ('agape',     'Agape'),
    ('event',     'Évènement'),
    ('hygiene',   'Hygiène'),
    ('equipment', 'Matériel'),
    ('other',     'Autre');

-- 2. New columns, NULL allowed for now: existing rows have no category yet
ALTER TABLE expenses
    ADD COLUMN category_id     TINYINT UNSIGNED NULL AFTER label,
    ADD COLUMN category_detail VARCHAR(100)     NULL AFTER category_id;

-- 3. Existing expenses go to "other", with a detail saying they were migrated
UPDATE expenses
SET category_id     = (SELECT id FROM categories WHERE slug = 'other'),
    category_detail = 'À recatégoriser';

-- 4. Every row now has a category: make it required, add the constraints
ALTER TABLE expenses
    MODIFY category_id TINYINT UNSIGNED NOT NULL,
    ADD CONSTRAINT chk_category_detail_not_empty CHECK (category_detail IS NULL OR category_detail <> ''),
    ADD CONSTRAINT fk_expenses_category FOREIGN KEY (category_id)
        REFERENCES categories (id) ON DELETE RESTRICT;
