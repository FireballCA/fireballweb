-- XP leaderboard for authenticated members.
-- Direct SELECT on public.profiles is typically restricted by RLS (users only see their row).
-- This RPC returns only leaderboard-safe columns for all profiles with an account.

create or replace function public.get_xp_leaderboard()
returns table (
  id uuid,
  first_name text,
  last_name text,
  xp integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.first_name,
    p.last_name,
    coalesce(p.xp, 0)::integer as xp
  from public.profiles p
  order by coalesce(p.xp, 0) desc, p.id asc;
$$;

comment on function public.get_xp_leaderboard() is
  'Returns all profile ids + XP + display names for the member leaderboard (no email / phone).';

revoke all on function public.get_xp_leaderboard() from public;
grant execute on function public.get_xp_leaderboard() to authenticated;
grant execute on function public.get_xp_leaderboard() to service_role;
