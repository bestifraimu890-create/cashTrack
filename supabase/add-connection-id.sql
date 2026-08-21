-- Add connection_id to profiles for parent-student linking
-- Run this in the Supabase SQL Editor
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'connection_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN connection_id text;
  END IF;
END $$;

-- Make connection_id unique (so two students can't share one code)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_connection_id_unique
  ON public.profiles (connection_id) WHERE connection_id IS NOT NULL;