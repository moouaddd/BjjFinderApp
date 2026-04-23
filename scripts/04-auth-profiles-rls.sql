-- ═══════════════════════════════════════════════════════════════
-- BJJ Spain — Auth + Profiles + RLS completo
-- Ejecutar en Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── 1. TABLA PROFILES ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text,
  name       text,
  role       text DEFAULT 'user' CHECK (role IN ('user', 'organizer', 'owner', 'admin')),
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles publicly readable"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ── 2. TRIGGER: crear perfil automáticamente al registrarse ──────────────────
--    Funciona con email/password Y con Google OAuth

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── 3. GYMS — añadir owner_id ─────────────────────────────────────────────────

ALTER TABLE public.gyms
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Recrear RLS (DROP las viejas primero)
DROP POLICY IF EXISTS "Gyms are publicly readable" ON public.gyms;
DROP POLICY IF EXISTS "Gyms publicly readable"     ON public.gyms;

CREATE POLICY "Gyms publicly readable"
  ON public.gyms FOR SELECT USING (true);

CREATE POLICY "Owner or admin can update gym"
  ON public.gyms FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Owner or admin can delete gym"
  ON public.gyms FOR DELETE
  USING (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 4. COMMUNITY_EVENTS — RLS basada en profiles ─────────────────────────────

DROP POLICY IF EXISTS "Authenticated users can create events" ON public.community_events;
DROP POLICY IF EXISTS "Creators can delete their events"      ON public.community_events;
DROP POLICY IF EXISTS "Admins can delete any event"          ON public.community_events;

-- Solo organizer / owner / admin pueden crear eventos
CREATE POLICY "Roles can create events"
  ON public.community_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('organizer', 'owner', 'admin')
    )
  );

-- El creador puede borrar su propio evento
CREATE POLICY "Creators can delete their events"
  ON public.community_events FOR DELETE
  USING (organizer_id = auth.uid());

-- Admin puede borrar cualquier evento
CREATE POLICY "Admins can delete any event"
  ON public.community_events FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 5. INSTRUCTORS — RLS basada en profiles ───────────────────────────────────

DROP POLICY IF EXISTS "Authenticated users can register as instructor" ON public.instructors;
DROP POLICY IF EXISTS "Admins can delete instructors"                  ON public.instructors;

CREATE POLICY "Authenticated users can register as instructor"
  ON public.instructors FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete instructors"
  ON public.instructors FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 6. HELPER: promover usuario a admin (reemplaza <USER_ID>) ─────────────────
-- UPDATE public.profiles SET role = 'admin' WHERE id = '<USER_ID>';
-- UPDATE public.profiles SET role = 'organizer' WHERE email = 'alguien@email.com';
