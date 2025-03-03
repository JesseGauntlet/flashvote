-- Migration to add category column to items table

BEGIN;

-- Add category column to items table
ALTER TABLE items
ADD COLUMN category text;

-- Update any views or functions that might reference the items table columns
-- (None found in the current schema)

-- Use DO block for PL/pgSQL code
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Added category column to items table';
END $$;

COMMIT; 