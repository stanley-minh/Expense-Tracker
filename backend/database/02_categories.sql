-- backend/database/02_categories.sql
-- Reference data: needed in EVERY environment (dev AND production),
-- unlike 03_seed.sql which only contains test data.
-- slug = technical code (English, used by the code), name = label shown to users (French).
-- "other" lets the user type a category that does not exist (expenses.category_detail).

-- The file contains accents (é, è...): tell the mysql client the file is UTF-8,
-- otherwise it may read it with another encoding and store "Ã©" instead of "é".
SET NAMES utf8mb4;

INSERT INTO categories (slug, name) VALUES
    ('contribution', 'Cotisation'),
    ('agape',        'Agape'),
    ('event',        'Évènement'),
    ('hygiene',      'Hygiène'),
    ('equipment',    'Matériel'),
    ('other',        'Autre');
