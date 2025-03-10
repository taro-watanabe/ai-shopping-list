-- Migration number: 0002
-- Migration name: Add People

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS people (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Check if column exists before adding
SELECT CASE WHEN EXISTS (
    SELECT 1 FROM pragma_table_info('items') WHERE name = 'person_id'
) THEN 1 ELSE 0 END;

-- If column doesn't exist, add it
ALTER TABLE items ADD COLUMN person_id INTEGER REFERENCES people(id);

COMMIT;