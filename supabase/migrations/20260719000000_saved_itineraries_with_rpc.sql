-- Applied to the "memorables" Supabase project. Kept in the repo so the
-- backend can be recreated from scratch (supabase db push / apply_migration).
--
-- Access model: RLS is enabled with NO policies, so the table is unreachable
-- through the Data API. The only access path is the security-definer RPCs
-- below, each of which requires an unguessable per-user sync key (uuid) -
-- effectively a bearer token. The security advisor flags anon-executable
-- security-definer functions; here that is the intended design (the app has
-- no sign-in).

create table public.saved_itineraries (
  id uuid primary key default gen_random_uuid(),
  user_key uuid not null,
  created_at timestamptz not null default now(),
  request jsonb not null,
  option jsonb not null
);

create index saved_itineraries_user_key_idx on public.saved_itineraries (user_key, created_at desc);

alter table public.saved_itineraries enable row level security;

create or replace function public.get_itineraries(p_user_key uuid)
returns setof public.saved_itineraries
language sql
security definer
set search_path = public
stable
as $$
  select * from public.saved_itineraries
  where user_key = p_user_key
  order by created_at desc
  limit 100;
$$;

create or replace function public.save_itinerary(p_user_key uuid, p_request jsonb, p_option jsonb)
returns public.saved_itineraries
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.saved_itineraries;
begin
  if pg_column_size(p_request) + pg_column_size(p_option) > 200000 then
    raise exception 'itinerary payload too large';
  end if;
  insert into public.saved_itineraries (user_key, request, option)
  values (p_user_key, p_request, p_option)
  returning * into result;
  return result;
end;
$$;

create or replace function public.delete_itinerary(p_user_key uuid, p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.saved_itineraries
  where id = p_id and user_key = p_user_key;
$$;

create or replace function public.get_shared_itinerary(p_id uuid)
returns table (id uuid, created_at timestamptz, request jsonb, option jsonb)
language sql
security definer
set search_path = public
stable
as $$
  select id, created_at, request, option
  from public.saved_itineraries
  where id = p_id;
$$;

revoke all on table public.saved_itineraries from anon, authenticated;
grant execute on function public.get_itineraries(uuid) to anon, authenticated;
grant execute on function public.save_itinerary(uuid, jsonb, jsonb) to anon, authenticated;
grant execute on function public.delete_itinerary(uuid, uuid) to anon, authenticated;
grant execute on function public.get_shared_itinerary(uuid) to anon, authenticated;
