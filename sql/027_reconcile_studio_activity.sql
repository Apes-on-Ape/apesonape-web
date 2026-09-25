-- Repair activity rows for Studio creations persisted in the new AOA era.
-- Launch boundary: 2026-09-24 00:00:00 UTC.
-- Creations before that boundary are not imported.
-- This script does NOT award AOA and does NOT write user_progress_events.
-- Not executed by the app. Review the SELECT, then run the INSERT if the rows look right.

-- 1. Preview missing activity events. No writes.
SELECT
  c.id AS creation_id,
  c.created_at,
  c.title,
  c.creator_address,
  COALESCE(
    NULLIF(c.glyph_profile->>'glyphId', ''),
    profile.glyph_user_id
  ) AS user_id,
  CASE
    WHEN NULLIF(c.artifact->'generator'->>'sourceCreationId', '') IS NOT NULL THEN 'transmission_remixed'
    ELSE 'transmission_published'
  END AS action
FROM public.studio_creations c
LEFT JOIN public.user_profiles profile
  ON lower(profile.wallet_address) = lower(c.creator_address)
WHERE c.created_at >= TIMESTAMPTZ '2026-09-24 00:00:00+00'
  AND NOT EXISTS (
    SELECT 1
    FROM public.user_activity_events activity
    WHERE activity.dedupe_key = CASE
      WHEN NULLIF(c.artifact->'generator'->>'sourceCreationId', '') IS NOT NULL THEN 'studio:remix:' || c.id::text
      ELSE 'studio:publish:' || c.id::text
    END
  )
  AND COALESCE(NULLIF(c.glyph_profile->>'glyphId', ''), profile.glyph_user_id) IS NOT NULL;

-- 2. Insert the missing events. Safe to re-run: dedupe_key is unique.
INSERT INTO public.user_activity_events (
  user_id,
  source,
  action,
  reference_id,
  dedupe_key,
  metadata,
  occurred_at
)
SELECT
  COALESCE(NULLIF(c.glyph_profile->>'glyphId', ''), profile.glyph_user_id),
  'studio',
  CASE
    WHEN NULLIF(c.artifact->'generator'->>'sourceCreationId', '') IS NOT NULL THEN 'transmission_remixed'
    ELSE 'transmission_published'
  END,
  c.id::text,
  CASE
    WHEN NULLIF(c.artifact->'generator'->>'sourceCreationId', '') IS NOT NULL THEN 'studio:remix:' || c.id::text
    ELSE 'studio:publish:' || c.id::text
  END,
  jsonb_build_object(
    'type', c.type,
    'title', left(COALESCE(c.title, ''), 80),
    'isRemix', NULLIF(c.artifact->'generator'->>'sourceCreationId', '') IS NOT NULL,
    'reconciled', true
  ),
  c.created_at
FROM public.studio_creations c
LEFT JOIN public.user_profiles profile
  ON lower(profile.wallet_address) = lower(c.creator_address)
WHERE c.created_at >= TIMESTAMPTZ '2026-09-24 00:00:00+00'
  AND COALESCE(NULLIF(c.glyph_profile->>'glyphId', ''), profile.glyph_user_id) IS NOT NULL
ON CONFLICT (dedupe_key) DO NOTHING;
