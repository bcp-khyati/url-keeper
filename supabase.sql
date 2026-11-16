-- Run this in Supabase → SQL Editor
create table if not exists links (
  key text primary key,
  url text not null,
  created_at timestamptz not null default now()
);

alter table links enable row level security;

create policy "anyone can read links"   on links for select using (true);
create policy "anyone can insert links" on links for insert with check (true);
