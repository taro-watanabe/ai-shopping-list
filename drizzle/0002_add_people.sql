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

SELECT CASE 
    WHEN EXISTS (SELECT * FROM pragma_table_info('items') WHERE name = 'person_id')
    THEN 1
    ELSE 0
END;

-- Add column if it doesn't exist
ALTER TABLE items ADD COLUMN person_id INTEGER REFERENCES people(id);


COMMIT;