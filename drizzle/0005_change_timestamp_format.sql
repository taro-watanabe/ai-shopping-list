-- Change timestamp columns to use text format instead of integer
ALTER TABLE tags RENAME COLUMN created_at TO created_at_old;
ALTER TABLE tags ADD COLUMN created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE tags SET created_at = datetime(created_at_old, 'unixepoch');
ALTER TABLE tags DROP COLUMN created_at_old;

ALTER TABLE people RENAME COLUMN created_at TO created_at_old;
ALTER TABLE people ADD COLUMN created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE people SET created_at = datetime(created_at_old, 'unixepoch');
ALTER TABLE people DROP COLUMN created_at_old;

ALTER TABLE items RENAME COLUMN created_at TO created_at_old;
ALTER TABLE items ADD COLUMN created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE items SET created_at = datetime(created_at_old, 'unixepoch');
ALTER TABLE items DROP COLUMN created_at_old;
