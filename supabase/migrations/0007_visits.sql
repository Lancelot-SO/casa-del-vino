-- Casa del Vino — visit tracking.
-- Run this whole file in the Supabase SQL editor after 0006.
--
-- Every page a visitor opens on the storefront writes one row here (the
-- browser inserts it directly; see app/src/lib/visits.ts). Nothing personal is
-- kept: no IP address, no name, no account id. "visitor" is a random id the
-- browser keeps in localStorage so the same phone counts once per day, and
-- "session" is a random id per browser tab session so "where visitors came
-- from" counts arrivals rather than clicks. Admins see the figures in
-- Admin → Dashboard → Visits, computed by visit_stats() below. Nobody else
-- can read the table. The admin's own browsing is never recorded.

create table public.page_views (
  id         bigint generated always as identity primary key,
  path       text not null,
  referrer   text not null default '',     -- host the session arrived from ('' = direct / typed)
  visitor    text not null,                -- random id kept in the visitor's browser
  session    text not null,                -- random id per tab session
  device     text not null default 'desktop',
  created_at timestamptz not null default now()
);
create index page_views_created_idx on public.page_views (created_at desc);

alter table public.page_views enable row level security;

-- Anyone may record a view (bounded so the table cannot be abused as storage).
create policy "page_views: anyone can record" on public.page_views
  for insert with check (
    length(path) between 1 and 200
    and length(referrer) <= 200
    and length(visitor) between 1 and 64
    and length(session) between 1 and 64
    and device in ('mobile', 'desktop')
  );

-- Only admins read; and in practice they read through visit_stats().
create policy "page_views: admin read" on public.page_views
  for select using (public.is_admin());

-- Everything the Visits card shows, for the last p_days days (7–365).
create or replace function public.visit_stats(p_days int default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_days  int := least(greatest(coalesce(p_days, 30), 7), 365);
  v_today timestamptz := date_trunc('day', now());
  v_since timestamptz := date_trunc('day', now()) - make_interval(days => v_days - 1);
  v_out   jsonb;
begin
  if not public.is_admin() then
    raise exception 'Only an admin can see visits';
  end if;

  with recent as (
    select path, referrer, visitor, session, device, created_at
      from public.page_views
     where created_at >= v_since
  ),
  per_day as (
    select d.day::date                       as day,
           count(r.visitor)                  as views,
           count(distinct r.visitor)         as visitors
      from generate_series(v_since, v_today, interval '1 day') as d(day)
      left join recent r on date_trunc('day', r.created_at) = d.day
     group by d.day
  )
  select jsonb_build_object(
    'days', (select coalesce(jsonb_agg(jsonb_build_object('day', day, 'views', views, 'visitors', visitors) order by day), '[]'::jsonb)
               from per_day),
    'today', (select jsonb_build_object('views', count(*), 'visitors', count(distinct visitor))
                from recent where created_at >= v_today),
    'week', (select jsonb_build_object('views', count(*), 'visitors', count(distinct visitor))
               from recent where created_at >= v_today - interval '6 days'),
    'range', (select jsonb_build_object('views', count(*), 'visitors', count(distinct visitor), 'sessions', count(distinct session))
                from recent),
    'all_time_views', (select count(*) from public.page_views),
    'top_pages', (select coalesce(jsonb_agg(jsonb_build_object('path', path, 'views', n) order by n desc), '[]'::jsonb)
                    from (select path, count(*) as n from recent group by path order by n desc, path limit 8) t),
    -- Arrivals by source: each session counted once, under the host it came from.
    'sources', (select coalesce(jsonb_agg(jsonb_build_object('referrer', referrer, 'sessions', n) order by n desc), '[]'::jsonb)
                  from (select referrer, count(distinct session) as n from recent where referrer <> '' group by referrer order by n desc, referrer limit 6) t),
    'direct_sessions', (select count(distinct session) from recent where referrer = ''),
    'mobile_views', (select count(*) from recent where device = 'mobile')
  ) into v_out;

  return v_out;
end;
$$;

revoke all on function public.visit_stats(int) from public;
grant execute on function public.visit_stats(int) to authenticated;
