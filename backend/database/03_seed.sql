-- backend/database/03_seed.sql
-- Test data for development only (never loaded in production).
-- Categories are found by their slug, never by a hard-coded id:
-- ids depend on insertion order, slugs never change.

-- The file contains accents (é, è...): tell the mysql client the file is UTF-8,
-- otherwise it may read it with another encoding and store "Ã©" instead of "é".
SET NAMES utf8mb4;

INSERT INTO expenses (label, category_id, category_detail, amount_cents, spent_at) VALUES
    ('Repas partagé du dimanche',
        (SELECT id FROM categories WHERE slug = 'agape'),   NULL,         4250, '2026-11-02'),
    ('Savon et essuie-tout',
        (SELECT id FROM categories WHERE slug = 'hygiene'), NULL,         1890, '2026-11-05'),
    ('Décorations de la fête de Noël',
        (SELECT id FROM categories WHERE slug = 'event'),   NULL,         7600, '2026-11-08'),
    ('Fleurs pour l''autel',
        (SELECT id FROM categories WHERE slug = 'other'),   'Décoration', 2500, '2026-11-09');
