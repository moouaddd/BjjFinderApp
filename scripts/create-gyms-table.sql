-- Run this once in Supabase → SQL Editor → New query
-- Creates the gyms table and the unique constraint needed for deduplication

CREATE TABLE IF NOT EXISTS public.gyms (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name           text NOT NULL,
  city           text,
  address        text,
  latitude       double precision,
  longitude      double precision,
  phone          text,
  email          text,
  website        text,
  open_mat_friday   boolean DEFAULT false NOT NULL,
  open_mat_saturday boolean DEFAULT false NOT NULL,
  open_mat_sunday   boolean DEFAULT false NOT NULL,
  -- extra fields preserved from the CSV source
  rating         double precision,
  rating_count   integer,
  source         text,
  created_at     timestamptz DEFAULT now() NOT NULL
);

-- Unique constraint used by the migration script to avoid duplicates
ALTER TABLE public.gyms
  DROP CONSTRAINT IF EXISTS gyms_name_city_unique;
ALTER TABLE public.gyms
  ADD CONSTRAINT gyms_name_city_unique UNIQUE (name, city);

-- Enable Row Level Security (recommended for Supabase)
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Gyms are publicly readable"
  ON public.gyms FOR SELECT
  USING (true);
