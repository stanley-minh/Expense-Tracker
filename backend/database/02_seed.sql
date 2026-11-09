-- backend/database/02_seed.sql
-- Test data for development only.

INSERT INTO expenses (label, amount_cents, spent_at) VALUES
    ('Groceries',    4250, '2026-11-02'),
    ('Train ticket', 1890, '2026-11-05');
