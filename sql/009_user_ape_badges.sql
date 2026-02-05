-- User Ape badges: store earned badges per address for fast profile display.
-- Badges are computed from wallet holdings (traits, outfits, milestones) and AI Studio publishes,
-- then cached here so we don't re-analyze on every profile load.

create table if not exists public.user_ape_badges (
  address text not null,
  badge_slug text not null,
  earned_at timestamptz not null default now(),
  primary key (address, badge_slug)
);

create index if not exists idx_user_ape_badges_address on public.user_ape_badges (address);

-- Optional: cache when we last analyzed this wallet (so we can refresh in background)
create table if not exists public.user_ape_badges_meta (
  address text primary key,
  analyzed_at timestamptz not null default now(),
  total_apes integer not null default 0
);

comment on table public.user_ape_badges is 'Earned Apes on Ape badges per wallet (trait, outfit, holder, AI Studio)';
comment on table public.user_ape_badges_meta is 'When we last computed badges and total ape count for that wallet';
