-- The player's cities (main, farms, alts). Each one has its own profile: City Hall level, kingdom
-- stage, spending profile and owned commanders. Private to the owner (never shown on /u/).

create type public.city_kind as enum ('main', 'farm', 'alt');

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind public.city_kind not null default 'main',
  name text not null check (char_length(name) between 1 and 40),
  city_hall smallint check (city_hall between 1 and 25),
  kingdom_stage text check (kingdom_stage in ('pre_kvk', 'kvk1', 'kvk2', 'kvk3', 'soc')),
  spending text check (spending in ('f2p', 'low', 'medium', 'high', 'whale', 'kraken')),
  -- The site's profile code (encodeProfile) so the device can rebuild the full questionnaire answers.
  profile_code text check (char_length(profile_code) <= 200),
  -- Owned commanders / checklist answers: { "<commander id>": { ... } }. Capped at 64 KB.
  commanders jsonb not null default '{}'::jsonb
    check (jsonb_typeof(commanders) = 'object' and pg_column_size(commanders) <= 65536),
  -- Id of the saved account on the device it came from (first-login upload), so a second upload
  -- updates the same row instead of duplicating it.
  local_id text check (char_length(local_id) <= 64),
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, local_id)
);

create index accounts_user_idx on public.accounts (user_id);
-- At most one main city per player.
create unique index accounts_one_main on public.accounts (user_id) where kind = 'main';

create or replace function public.accounts_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if (select count(*) from public.accounts where user_id = new.user_id) >= 20 then
      raise exception 'Too many cities (20).' using errcode = '23514';
    end if;
  else
    new.id := old.id;
    new.user_id := old.user_id;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger accounts_before_write
  before insert or update on public.accounts
  for each row execute function public.accounts_before_write();

alter table public.accounts enable row level security;

create policy "accounts: owner reads" on public.accounts
  for select to authenticated using (user_id = (select auth.uid()));
create policy "accounts: owner adds" on public.accounts
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "accounts: owner edits" on public.accounts
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "accounts: owner removes" on public.accounts
  for delete to authenticated using (user_id = (select auth.uid()));
