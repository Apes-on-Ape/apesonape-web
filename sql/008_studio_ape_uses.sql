-- Track one-time ape usage for studio creations
create table if not exists public.studio_ape_uses (
  ape_id bigint primary key,
  used_by text not null,
  creation_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists studio_ape_uses_used_by_idx on public.studio_ape_uses (used_by);
