-- Run in Supabase → SQL Editor
-- Creates community_events and instructors tables

-- ── community_events ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.community_events (
  id                text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type              text NOT NULL CHECK (type IN ('openmat', 'seminario', 'campamento')),
  title             text NOT NULL,
  organizer         text NOT NULL,
  organizer_contact text NOT NULL,
  organizer_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  gym               text NOT NULL,
  address           text NOT NULL,
  city              text NOT NULL,
  date              text NOT NULL,
  time              text NOT NULL,
  duration          text NOT NULL,
  price             float DEFAULT 0,
  category          text NOT NULL,
  modality          text NOT NULL,
  description       text NOT NULL,
  spots_total       integer,
  spots_left        integer,
  instructor        text,
  instructor_belt   text,
  tags              text[] DEFAULT '{}',
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events publicly readable"
  ON public.community_events FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create events"
  ON public.community_events FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Creators can delete their events"
  ON public.community_events FOR DELETE
  USING (organizer_id = auth.uid());

CREATE POLICY "Admins can delete any event"
  ON public.community_events FOR DELETE
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ── instructors ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.instructors (
  id                text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name              text NOT NULL,
  belt              text NOT NULL CHECK (belt IN ('azul', 'morado', 'marrón', 'negro')),
  stripes           integer DEFAULT 0,
  team              text NOT NULL,
  city              text NOT NULL,
  gym               text,
  bio               text NOT NULL,
  specialties       text[] DEFAULT '{}',
  modalities        text[] DEFAULT '{}',
  price_per_hour    float NOT NULL,
  price_per_session float,
  online            boolean DEFAULT false,
  in_person         boolean DEFAULT true,
  instagram         text,
  contact           text NOT NULL,
  experience        text NOT NULL,
  languages         text[] DEFAULT '{}',
  availability      text NOT NULL,
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors publicly readable"
  ON public.instructors FOR SELECT USING (true);

CREATE POLICY "Authenticated users can register as instructor"
  ON public.instructors FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete instructors"
  ON public.instructors FOR DELETE
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
