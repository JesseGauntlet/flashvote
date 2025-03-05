-- Migration to add auto-profile creation on user registration

-- First, check if the function already exists and drop it if it does
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, is_premium, creator, metadata)
  VALUES (NEW.id, false, false, '{}');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger to automatically create a profile when a user registers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create profiles for existing users who don't have one yet
INSERT INTO public.profiles (id, is_premium, creator, metadata)
SELECT id, false, false, '{}'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- Output confirmation
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Auto-profile creation has been set up';
END $$; 