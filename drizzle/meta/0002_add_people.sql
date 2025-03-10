-- Migration number: 0002
-- Migration name: Add People

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS people (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

ALTER TABLE items ADD COLUMN IF NOT EXISTS person_id INTEGER REFERENCES people(id);

COMMIT;