-- Migration to add name and email fields to profiles table

-- Add name column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS name text;

-- Add email column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email text;

-- Update existing profiles with email from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
AND p.email IS NULL;

-- Modify the handle_new_user function to include email from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, is_premium, email, creator, metadata)
  VALUES (NEW.id, false, NEW.email, false, '{}');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Output confirmation
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Added name and email fields to profiles table';
END $$; 