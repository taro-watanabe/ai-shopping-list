-- Migration number: 0002
-- Migration name: Add People

BEGIN TRANSACTION;

-- Create people table if it doesn't exist
CREATE TABLE IF NOT EXISTS people (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Check if person_id column exists
SELECT CASE WHEN EXISTS (
    SELECT 1 FROM pragma_table_info('items') WHERE name = 'person_id'
) THEN 1 ELSE 0 END;

-- Only add person_id column if it doesn't exist
INSERT INTO items (person_id)
SELECT NULL
WHERE NOT EXISTS (
    SELECT 1 FROM pragma_table_info('items') WHERE name = 'person_id'
);

COMMIT;