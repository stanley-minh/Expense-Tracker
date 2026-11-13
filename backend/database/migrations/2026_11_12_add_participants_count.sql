-- backend/database/migrations/2026_11_12_add_participants_count.sql
-- Migration: adds the number of people an expense is shared between.
-- Safe on an existing database: existing expenses get the default value 1 (not shared),
-- and the accounts already created are kept (no need for "docker compose down -v").
--
-- Run once:
--   docker compose exec -T database sh -c 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' \
--     < backend/database/migrations/2026_11_12_add_participants_count.sql

ALTER TABLE expenses
    ADD COLUMN participants_count SMALLINT UNSIGNED NOT NULL DEFAULT 1 AFTER amount_cents,
    ADD CONSTRAINT chk_participants_range CHECK (participants_count BETWEEN 1 AND 1000);
