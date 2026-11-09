-- backend/database/03_seed.sql
-- Test data for development only (never loaded in production).
-- Category ids come from 02_categories.sql:
--   1 = contribution, 2 = agape, 3 = event, 4 = hygiene, 5 = equipment, 6 = other

-- The file contains accents (é, è...): tell the mysql client the file is UTF-8,
-- otherwise it may read it with another encoding and store "Ã©" instead of "é".
SET NAMES utf8mb4;

INSERT INTO expenses (label, category_id, category_detail, amount_cents, spent_at) VALUES
    ('Repas partagé du dimanche',     2, NULL,         4250, '2026-11-02'),
    ('Savon et essuie-tout',          4, NULL,         1890, '2026-11-05'),
    ('Décorations de la fête de Noël', 3, NULL,        7600, '2026-11-08'),
    ('Fleurs pour l''autel',          6, 'Décoration', 2500, '2026-11-09');
