-- KingdomOps community core: public profiles, visibility and blocks.
-- Every table has RLS on. No game credentials are ever stored (a Lilith login does not exist and
-- asking for game credentials is forbidden). The game's data cannot be read: everything here is
-- typed by the player or earned on the site.

-- Who can see a profile:
--   public  = anyone with the link, signed in or not
--   members = signed-in KingdomOps users only
--   private = only the owner (default: minors play this game, so nothing is shown until chosen)
create type public.profile_visibility as enum ('public', 'members', 'private');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  -- Lower-case handle for /u/<handle>/. Null until the player picks one (profile not reachable).
  handle text unique
    check (handle ~ '^[a-z0-9_]{3,20}$'),
  display_name text
    check (char_length(display_name) between 1 and 40 and display_name !~ '[[:cntrl:]]'),
  -- No links in the bio (spam and grooming risk: minors use the site).
  bio text
    check (char_length(bio) <= 280 and bio !~* '(https?://|www\.|discord\.gg|discord\.com/invite)'),
  kingdom_number integer
    check (kingdom_number between 1 and 99999),
  -- Storage object paths, always inside the owner's own folder ("<id>/...").
  avatar_path text
    check (avatar_path is null or (avatar_path like id::text || '/%' and char_length(avatar_path) <= 200)),
  banner_path text
    check (banner_path is null or (banner_path like id::text || '/%' and char_length(banner_path) <= 200)),
  visibility public.profile_visibility not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Community profile. Only fields meant to be shown: no e-mail, no age, no location.';

-- Handles that would impersonate the site, the game company or staff.
create or replace function public.handle_is_reserved(h text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select h ~ '(lilith|kingdomops|official|admin|moderator|support|staff|system|riseofkingdoms)'
      or h in ('me', 'u', 'login', 'logout', 'auth', 'null', 'undefined', 'root', 'help', 'guide', 'guides', 'api')
$$;

create or replace function public.profiles_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.handle is not null then
    new.handle := lower(new.handle);
    if public.handle_is_reserved(new.handle)
       and (tg_op = 'INSERT' or new.handle is distinct from old.handle) then
      raise exception 'This handle is reserved.' using errcode = '23514';
    end if;
  end if;
  if new.display_name is not null then new.display_name := btrim(new.display_name); end if;
  if new.bio is not null then new.bio := btrim(new.bio); end if;
  if tg_op = 'UPDATE' then
    new.id := old.id;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_before_write
  before insert or update on public.profiles
  for each row execute function public.profiles_before_write();

-- One empty, private profile per new sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Blocks: the blocker stops the blocked user from seeing their profile and achievements.
create table public.blocks (
  blocker_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index blocks_blocked_idx on public.blocks (blocked_id);

alter table public.blocks enable row level security;

create policy "blocks: owner reads" on public.blocks
  for select to authenticated using (blocker_id = (select auth.uid()));
create policy "blocks: owner adds" on public.blocks
  for insert to authenticated with check (blocker_id = (select auth.uid()));
create policy "blocks: owner removes" on public.blocks
  for delete to authenticated using (blocker_id = (select auth.uid()));

create or replace function public.blocks_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.blocks where blocker_id = new.blocker_id) >= 1000 then
    raise exception 'Block list is full (1000).' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger blocks_limit before insert on public.blocks
  for each row execute function public.blocks_limit();

-- Can the current viewer see what this user shows? Security definer so it can read the owner's
-- block list and profile visibility (RLS hides both from everyone else).
create or replace function public.can_view_user(owner uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select owner = (select auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = owner
        and p.handle is not null
        and (p.visibility = 'public' or (p.visibility = 'members' and (select auth.uid()) is not null))
        and not exists (
          select 1 from public.blocks b
          where b.blocker_id = owner and b.blocked_id = (select auth.uid())
        )
    )
$$;

revoke all on function public.can_view_user(uuid) from public;
grant execute on function public.can_view_user(uuid) to anon, authenticated;

alter table public.profiles enable row level security;

create policy "profiles: visible ones are readable" on public.profiles
  for select to anon, authenticated using (public.can_view_user(id));
create policy "profiles: owner creates own" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles: owner edits own" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
-- No delete policy: the profile goes away with the account (delete_my_account).
