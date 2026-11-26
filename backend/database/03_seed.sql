-- backend/database/03_seed.sql
-- Test data for development only (never loaded in production).
-- Categories are found by their slug, never by a hard-coded id:
-- ids depend on insertion order, slugs never change.

-- The file contains accents (é, è...): tell the mysql client the file is UTF-8,
-- otherwise it may read it with another encoding and store "Ã©" instead of "é".
SET NAMES utf8mb4;

-- Demo account — email: demo@eglise.test / password: demo-password-2026
-- The hash below was generated with password_hash('demo-password-2026', PASSWORD_BCRYPT, ['cost' => 12]).
INSERT INTO users (name, email, password_hash) VALUES
    ('Compte démo', 'demo@eglise.test', '$2y$12$Ro2wTZLLwe1wFwldy.JtJOzOc7FBbLIeo4SDGkuG5cRXoIdxcEk7a');

-- Expenses of the demo account (owner found by email, like the categories by slug)
INSERT INTO expenses (user_id, label, category_id, category_detail, amount_cents, spent_at, is_validated, validated_at) VALUES
    ((SELECT id FROM users WHERE email = 'demo@eglise.test'), 'Repas partagé du dimanche',
        (SELECT id FROM categories WHERE slug = 'agape'),   NULL,         4250, '2026-11-02', TRUE,  NOW()),
    ((SELECT id FROM users WHERE email = 'demo@eglise.test'), 'Savon et essuie-tout',
        (SELECT id FROM categories WHERE slug = 'hygiene'), NULL,         1890, '2026-11-05', FALSE, NULL),
    ((SELECT id FROM users WHERE email = 'demo@eglise.test'), 'Décorations de la fête de Noël',
        (SELECT id FROM categories WHERE slug = 'event'),   NULL,         7600, '2026-11-08', FALSE, NULL),
    ((SELECT id FROM users WHERE email = 'demo@eglise.test'), 'Fleurs pour l''autel',
        (SELECT id FROM categories WHERE slug = 'other'),   'Décoration', 2500, '2026-11-09', FALSE, NULL);

-- Participants of the shared expenses. INVENTED first names only: never put real
-- church members in a seed (it ends up in Git, on GitHub, on every developer's machine).
-- 42,50 € / 4 people = 10,63 € + 10,63 € + 10,62 € + 10,62 € (Euclidean division)
INSERT INTO expense_participants (expense_id, name, has_paid, paid_at)
SELECT e.id, p.name, p.has_paid, IF(p.has_paid, NOW(), NULL)
FROM expenses e
JOIN (
    SELECT 'Repas partagé du dimanche' AS label, 'Alice M.' AS name, TRUE AS has_paid
    UNION ALL SELECT 'Repas partagé du dimanche', 'Bruno T.', TRUE
    UNION ALL SELECT 'Repas partagé du dimanche', 'Chloé R.', FALSE
    UNION ALL SELECT 'Repas partagé du dimanche', 'David L.', FALSE
    UNION ALL SELECT 'Décorations de la fête de Noël', 'Emma P.', FALSE
    UNION ALL SELECT 'Décorations de la fête de Noël', 'Félix K.', TRUE
    UNION ALL SELECT 'Décorations de la fête de Noël', 'Gabriel N.', FALSE
) AS p ON p.label = e.label
WHERE e.user_id = (SELECT id FROM users WHERE email = 'demo@eglise.test')
ORDER BY e.id, p.name; -- insertion order = id order = order used to split the cents
