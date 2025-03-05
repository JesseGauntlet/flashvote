-- Update RLS policy for event creation to restrict to creators

-- Drop the existing policy
DROP POLICY IF EXISTS "Authenticated users can create events" ON events;

-- Create the new policy that checks for creator=true
CREATE POLICY "Creators can create events"
    ON events FOR INSERT
    WITH CHECK (auth.uid() = owner_id AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND creator = true
    ));

-- Output confirmation
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Updated events RLS policy to restrict creation to users with creator=true';
END $$; 