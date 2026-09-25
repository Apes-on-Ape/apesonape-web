-- studio_creations is exposed to PostgREST. Enable RLS.
-- The app writes with the service role, which bypasses RLS.
-- Public visitors may read published rows. They may not insert, update, or delete.

ALTER TABLE public.studio_creations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS studio_creations_public_read ON public.studio_creations;

CREATE POLICY studio_creations_public_read
ON public.studio_creations
FOR SELECT
TO anon, authenticated
USING (true);
