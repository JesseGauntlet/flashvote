-- Migration to add creator field to profiles table

-- Add creator column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS creator boolean DEFAULT false;

-- Update handle_new_user function to include creator field
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
  RAISE NOTICE 'Migration completed: Added creator field to profiles table';
END $$; 