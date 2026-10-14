-- Achievements shown on the profile. Two sources, never mixed up:
--   site = earned on KingdomOps and checked by the database (claim_site_achievement), verified = true
--   self = typed by the player ("Reached CH 25", "KvK winner"), always verified = false and labelled
--          "Unverified" on the site. The game's data cannot be read, so nothing from the game is verified.

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  source text not null check (source in ('site', 'self')),
  code text not null check (code ~ '^[a-z0-9_-]{1,40}$'),
  title text not null check (char_length(title) between 1 and 80 and title !~ '[[:cntrl:]]'),
  detail text check (char_length(detail) <= 200 and detail !~* '(https?://|www\.)'),
  verified boolean not null default false,
  earned_at timestamptz not null default now(),
  check (source = 'site' or verified = false),
  unique (user_id, source, code)
);

create index achievements_user_idx on public.achievements (user_id);

create or replace function public.achievements_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    -- Only claim_site_achievement (security definer, runs as the table owner) can add site ones.
    if new.source = 'site' and current_user in ('anon', 'authenticated') then
      raise exception 'Site achievements are earned, not added.' using errcode = '42501';
    end if;
    if new.source = 'self'
       and (select count(*) from public.achievements where user_id = new.user_id and source = 'self') >= 30 then
      raise exception 'Too many self-declared achievements (30).' using errcode = '23514';
    end if;
  else
    if old.source = 'site' and current_user in ('anon', 'authenticated') then
      raise exception 'Site achievements cannot be edited.' using errcode = '42501';
    end if;
    new.id := old.id;
    new.user_id := old.user_id;
    new.source := old.source;
    new.verified := old.verified;
  end if;
  if new.source = 'self' then new.verified := false; end if;
  return new;
end;
$$;

create trigger achievements_before_write
  before insert or update on public.achievements
  for each row execute function public.achievements_before_write();

alter table public.achievements enable row level security;

create policy "achievements: shown with the profile" on public.achievements
  for select to anon, authenticated using (public.can_view_user(user_id));
create policy "achievements: owner declares" on public.achievements
  for insert to authenticated
  with check (user_id = (select auth.uid()) and source = 'self' and verified = false);
create policy "achievements: owner edits declared" on public.achievements
  for update to authenticated
  using (user_id = (select auth.uid()) and source = 'self')
  with check (user_id = (select auth.uid()) and source = 'self');
-- The owner may hide (delete) any of their achievements; a site one can be claimed again.
create policy "achievements: owner removes" on public.achievements
  for delete to authenticated using (user_id = (select auth.uid()));

-- Site achievements the database can check on its own. Returns true when the player has it
-- (newly or already). Streak achievements wait for routine sync (not stored server-side yet).
create or replace function public.claim_site_achievement(p_code text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  ok boolean;
  t text;
begin
  if me is null then
    raise exception 'Not signed in.' using errcode = '42501';
  end if;
  case p_code
    when 'onboarded' then
      t := 'Set up a city on KingdomOps';
      ok := exists (select 1 from public.accounts where user_id = me and city_hall is not null);
    when 'farm_keeper' then
      t := 'Planned a farm account';
      ok := exists (select 1 from public.accounts where user_id = me and kind = 'farm');
    when 'profile_complete' then
      t := 'Completed the community profile';
      ok := exists (
        select 1 from public.profiles
        where id = me and handle is not null and display_name is not null
          and bio is not null and avatar_path is not null
      );
    when 'data_saved' then
      t := 'Saved device data to the account';
      ok := exists (select 1 from public.local_imports where user_id = me);
    else
      raise exception 'Unknown achievement.' using errcode = '22023';
  end case;
  if ok then
    insert into public.achievements (user_id, source, code, title, verified)
    values (me, 'site', p_code, t, true)
    on conflict (user_id, source, code) do nothing;
  end if;
  return ok;
end;
$$;

revoke all on function public.claim_site_achievement(text) from public, anon;
grant execute on function public.claim_site_achievement(text) to authenticated;
