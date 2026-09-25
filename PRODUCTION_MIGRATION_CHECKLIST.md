# Production migration checklist

Do not run these files from the app. Apply them by hand in Supabase, staging first, after a backup.

`staging has it` and `production has it` are **unknown** until someone checks the live projects. This audit did not query either database.

Do not run `sql/021b_seed_legacy_bananas.sql`. Legacy Bananas are not seeded.

Do not run `sql/022_reset_aoa_progress.sql`. It deletes AOA progression.

| File | Purpose | Depends on | Idempotent | Data risk | Rollback | Staging | Production |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `sql/021_aoa_progress.sql` | AOA ledger, level helpers, era tables | Existing `user_profiles` | Re-run recomputes totals and skips `source = legacy` | Rewrites AOA totals from events | Restore the backup. Do not use `022` as a rollback | Unknown | Unknown |
| `sql/021b_seed_legacy_bananas.sql` | Withdrawn banana seed | — | — | **DO NOT RUN** | — | Must stay unapplied | Must stay unapplied |
| `sql/022_reset_aoa_progress.sql` | Deletes AOA launch tables | `021` | Yes, and destructive | **DO NOT RUN** | Restore the backup | Must stay unapplied | Must stay unapplied |
| `sql/023_user_wallet_aliases.sql` | Wallet display names | `user_profiles` | `CREATE TABLE IF NOT EXISTS` | Additive | Drop `user_wallet_aliases` only if it has no names you need | Unknown | Unknown |
| `sql/024_user_profile_achievements.sql` | Profile achievement unlocks | `user_profiles` | `CREATE TABLE IF NOT EXISTS` | Additive | Drop `user_profile_achievements` loses unlock history | Unknown | Unknown |
| `sql/025_aoa_arcade_era_points.sql` | Era points column | `021` (`aoa_arcade_era`) | `ADD COLUMN IF NOT EXISTS` | Additive | Drop the column if it was just added and is empty | Unknown | Unknown |
| `sql/026_user_activity_events.sql` | Activity feed | `user_profiles` | `CREATE TABLE IF NOT EXISTS` | Additive | Drop `user_activity_events` loses the feed | Unknown | Unknown |
| `sql/027_reconcile_studio_activity.sql` | Backfill studio activity since 2026-09-24 | `026` and `studio_creations` | `ON CONFLICT DO NOTHING` | Inserts activity rows. Does not pay AOA | Delete the backfilled keys if you can identify them | Unknown | Unknown |
| `sql/028_user_notifications.sql` | Inbox and NFT ownership baseline | `user_profiles` | `CREATE TABLE IF NOT EXISTS` | Additive | Drop the three new tables loses notifications and the baseline | Unknown | Unknown |
| `sql/029_public_profile_links.sql` | X and OpenSea visibility | `user_profiles` | `CREATE TABLE IF NOT EXISTS` | Additive. Public links stay off until a row exists | Drop the two tables hides public links | Unknown | Unknown |
| `sql/030_profile_avatar_token.sql` | Reserved `avatar_token_id` column | `user_profiles` | `ADD COLUMN IF NOT EXISTS` | Additive. The UI does not use it | Drop the column if nothing writes it | Unknown | Unknown |
| `sql/031_lock_anon_profile_writes.sql` | Drops anon insert/update policies on profiles, scores, and legacy notifications | `004`, `014`, `017` policies if they were applied | `DROP POLICY IF EXISTS` | Removes browser writes. Does not delete rows | Recreate the old policies only if a client still depends on them | Unknown | Unknown |

Suggested staging order: `021`, then `025`, then `023`, `024`, `026`, `028`, `029`, `030`, then `031` after a signed-in score save still succeeds through the API. Run `027` only after `026` and only if the backfill is wanted. Never run `021b` or `022`.
