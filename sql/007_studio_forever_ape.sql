-- Table to store user's selected "forever ape"
create table if not exists public.studio_forever_ape (
  address text primary key,
  ape_id bigint not null,
  created_at timestamptz not null default now()
);

create index if not exists studio_forever_ape_address_idx on public.studio_forever_ape (address);

