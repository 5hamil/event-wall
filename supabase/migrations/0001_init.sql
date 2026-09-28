-- Event Wall initial schema and row-level security policies.
create extension if not exists pgcrypto;

create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  description text,
  contact_email text,
  contact_phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.club_accounts (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (club_id, user_id)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  title text not null,
  description text,
  poster_url text,
  event_date date not null,
  event_time time,
  venue text,
  category_id uuid references public.categories(id) on delete set null,
  registration_link text,
  contact_details text,
  status text not null default 'draft' check (status in ('draft', 'pending', 'approved', 'rejected')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_public_listing_idx on public.events (event_date, created_at) where status = 'approved';
create index events_club_idx on public.events (club_id);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_set_updated_at
before update on public.events
for each row execute function public.set_updated_at();

-- Security-definer helpers prevent recursive RLS checks against membership tables.
create function public.is_event_wall_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins a where a.user_id = (select auth.uid())
  );
$$;

create function public.is_event_wall_club_account(target_club_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.club_accounts ca
    where ca.club_id = target_club_id and ca.user_id = (select auth.uid())
  );
$$;

alter table public.clubs enable row level security;
alter table public.admins enable row level security;
alter table public.club_accounts enable row level security;
alter table public.categories enable row level security;
alter table public.events enable row level security;

-- Public discovery is limited to active clubs and approved events.
create policy "Public can view active clubs"
on public.clubs for select to anon, authenticated
using (is_active = true);

create policy "Public can view approved events"
on public.events for select to anon, authenticated
using (status = 'approved');

-- Admins can manage every row in each application table.
create policy "Admins manage clubs" on public.clubs
for all to authenticated using (public.is_event_wall_admin()) with check (public.is_event_wall_admin());
create policy "Admins manage admins" on public.admins
for all to authenticated using (public.is_event_wall_admin()) with check (public.is_event_wall_admin());
create policy "Admins manage club accounts" on public.club_accounts
for all to authenticated using (public.is_event_wall_admin()) with check (public.is_event_wall_admin());
create policy "Admins manage categories" on public.categories
for all to authenticated using (public.is_event_wall_admin()) with check (public.is_event_wall_admin());
create policy "Admins manage events" on public.events
for all to authenticated using (public.is_event_wall_admin()) with check (public.is_event_wall_admin());

-- Club accounts may access events belonging to their club only.
create policy "Club accounts view own events" on public.events
for select to authenticated
using (public.is_event_wall_club_account(club_id));
create policy "Club accounts create own events" on public.events
for insert to authenticated
with check (public.is_event_wall_club_account(club_id));
create policy "Club accounts update own events" on public.events
for update to authenticated
using (public.is_event_wall_club_account(club_id))
with check (public.is_event_wall_club_account(club_id));
create policy "Club accounts delete own events" on public.events
for delete to authenticated
using (public.is_event_wall_club_account(club_id));

-- Club accounts can view and update their own club's profile.
create policy "Club accounts view own club" on public.clubs
for select to authenticated
using (public.is_event_wall_club_account(id));
create policy "Club accounts update own club" on public.clubs
for update to authenticated
using (public.is_event_wall_club_account(id))
with check (public.is_event_wall_club_account(id));

-- Authenticated app sessions need table privileges in addition to RLS policies.
grant usage on schema public to anon, authenticated;
grant select on public.clubs, public.events to anon, authenticated;
grant select, insert, update, delete on public.clubs, public.admins, public.club_accounts, public.categories, public.events to authenticated;

grant execute on function public.is_event_wall_admin() to authenticated;
grant execute on function public.is_event_wall_club_account(uuid) to authenticated;
