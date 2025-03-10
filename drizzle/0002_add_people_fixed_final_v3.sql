-- Check if column exists before adding
SELECT CASE 
    WHEN EXISTS (SELECT * FROM pragma_table_info('items') WHERE name = 'person_id')
    THEN 1
    ELSE 0
END;

-- Add column if it doesn't exist
ALTER TABLE items ADD COLUMN person_id INTEGER REFERENCES people(id);