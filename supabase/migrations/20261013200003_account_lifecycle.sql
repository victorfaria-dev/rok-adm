-- First-login upload of this device's data, and LGPD rights: delete the account (export is done by
-- the client reading every table below with the owner's own session; see apps/web/src/lib/auth/account-data.ts).

-- A copy of the device's "Back up everything" file (ko:* keys, without the Discord webhook secret),
-- uploaded only when the player says yes. Kept so nothing typed on a device is lost when the app moves
-- to accounts. Private to the owner.
create table public.local_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Short label of the device it came from, typed by nobody: e.g. "Chrome on Android".
  device_label text check (char_length(device_label) <= 80),
  payload jsonb not null
    check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) <= 524288)
);

create index local_imports_user_idx on public.local_imports (user_id, created_at desc);

create or replace function public.local_imports_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Keep the 10 most recent uploads per player.
  delete from public.local_imports
  where user_id = new.user_id
    and id in (
      select id from public.local_imports where user_id = new.user_id
      order by created_at desc offset 9
    );
  return new;
end;
$$;

create trigger local_imports_limit before insert on public.local_imports
  for each row execute function public.local_imports_limit();

alter table public.local_imports enable row level security;

create policy "local_imports: owner reads" on public.local_imports
  for select to authenticated using (user_id = (select auth.uid()));
create policy "local_imports: owner adds" on public.local_imports
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "local_imports: owner removes" on public.local_imports
  for delete to authenticated using (user_id = (select auth.uid()));

-- Delete the signed-in account. Everything owned cascades from auth.users (profiles, accounts,
-- achievements, blocks, local imports, reports about this user); reports this user filed keep the
-- report but lose the reporter (on delete set null). The client removes the avatar and banner files
-- from Storage first (Storage files are not rows the database can cascade).
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null then
    raise exception 'Not signed in.' using errcode = '42501';
  end if;
  delete from auth.users where id = me;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
