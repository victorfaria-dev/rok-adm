-- Review verifications from the Supabase dashboard (SQL editor) until there is a moderator page.
-- The SQL editor has no signed-in user (auth.uid() is null), so this wrapper takes the moderator's
-- user id, checks it is a moderator, and runs review_verification as that user. Only the table
-- owner / service role can call it; players cannot.
create or replace function public.review_verification_as(
  p_moderator uuid, p_request_id uuid, p_approve boolean, p_level smallint, p_values jsonb, p_note text default null
)
returns public.verification_requests
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.moderators where user_id = p_moderator) then
    raise exception 'Not a moderator.' using errcode = '42501';
  end if;
  perform set_config('request.jwt.claim.sub', p_moderator::text, true);
  return public.review_verification(p_request_id, p_approve, p_level, p_values, p_note);
end;
$$;

revoke all on function public.review_verification_as(uuid, uuid, boolean, smallint, jsonb, text) from public, anon, authenticated;
grant execute on function public.review_verification_as(uuid, uuid, boolean, smallint, jsonb, text) to service_role;
