-- Ensure `add_experience` works when no `user_profiles` row exists yet (RPC used to
-- return values even when UPDATE touched 0 rows). Run after 014.
-- Idempotent: replaces function only.

CREATE OR REPLACE FUNCTION public.add_experience(user_wallet TEXT, xp_amount INTEGER)
RETURNS TABLE(new_level INTEGER, level_up BOOLEAN, total_xp INTEGER) AS $$
DECLARE
  old_level INTEGER;
  new_xp INTEGER;
  calculated_level INTEGER;
  did_level_up BOOLEAN := FALSE;
  w TEXT;
BEGIN
  w := lower(trim(user_wallet));
  IF w = '' THEN
    RETURN;
  END IF;

  INSERT INTO public.user_profiles (glyph_user_id, wallet_address, bananas)
  VALUES ('legacy:' || w, w, 0)
  ON CONFLICT (wallet_address) DO NOTHING;

  SELECT level, experience INTO old_level, new_xp
  FROM public.user_profiles WHERE wallet_address = w;

  new_xp := COALESCE(new_xp, 0) + xp_amount;
  calculated_level := get_level_from_experience(new_xp);
  IF calculated_level > COALESCE(old_level, 1) THEN
    did_level_up := TRUE;
  END IF;

  UPDATE public.user_profiles SET experience = new_xp, level = calculated_level WHERE wallet_address = w;

  RETURN QUERY SELECT calculated_level, did_level_up, new_xp;
END;
$$ LANGUAGE plpgsql;
