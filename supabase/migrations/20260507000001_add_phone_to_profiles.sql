-- Add phone column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add comment to document the column
COMMENT ON COLUMN public.profiles.phone IS 'User phone number';
