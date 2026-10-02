-- Publish club events immediately and make published/archived rows admin-only
-- for mutations. Existing moderation history is migrated into the new states.

alter table public.events drop constraint if exists events_status_check;

update public.events
set status = case
  when status in ('approved', 'pending') then 'published'
  when status = 'rejected' then 'draft'
  else status
end,
rejection_reason = case when status = 'rejected' then null else rejection_reason end;

alter table public.events
  add constraint events_status_check
  check (status in ('draft', 'published', 'archived'));

drop index if exists public.events_public_listing_idx;
create index events_public_listing_idx
  on public.events (event_date, created_at)
  where status = 'published';

drop policy if exists "Public can view approved events" on public.events;
drop policy if exists "Public can view published events" on public.events;
create policy "Public can view published events"
on public.events for select to anon, authenticated
using (status = 'published');

drop policy if exists "Club accounts create own events" on public.events;
create policy "Club accounts create own events"
on public.events for insert to authenticated
with check (
  public.is_event_wall_club_account(club_id)
  and status in ('draft', 'published')
);

drop policy if exists "Club accounts update own events" on public.events;
create policy "Club accounts update own draft events"
on public.events for update to authenticated
using (
  public.is_event_wall_club_account(club_id)
  and status = 'draft'
)
with check (
  public.is_event_wall_club_account(club_id)
  and status in ('draft', 'published')
);

drop policy if exists "Club accounts delete own events" on public.events;
drop policy if exists "Club accounts delete own draft events" on public.events;
create policy "Club accounts delete own draft events"
on public.events for delete to authenticated
using (
  public.is_event_wall_club_account(club_id)
  and status = 'draft'
);
