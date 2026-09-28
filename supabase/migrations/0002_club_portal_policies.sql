-- Club portal access and media uploads. Club-owned files use a UUID folder:
-- <club_id>/<filename> in the posters and logos buckets.

-- Club sessions may resolve their own account row for server-side context.
create policy "Club accounts can view own account link"
on public.club_accounts for select to authenticated
using (user_id = (select auth.uid()));

-- Club users need to choose from the shared category list when creating events.
create policy "Authenticated users can view categories"
on public.categories for select to authenticated
using (true);

-- Club users may submit or revise drafts and pending events, but cannot
-- approve/reject events or delete anything after it leaves draft status.
drop policy "Club accounts create own events" on public.events;
create policy "Club accounts create own events"
on public.events for insert to authenticated
with check (
  public.is_event_wall_club_account(club_id)
  and status in ('draft', 'pending')
);

drop policy "Club accounts update own events" on public.events;
create policy "Club accounts update own events"
on public.events for update to authenticated
using (public.is_event_wall_club_account(club_id))
with check (
  public.is_event_wall_club_account(club_id)
  and status in ('draft', 'pending')
);

drop policy "Club accounts delete own events" on public.events;
create policy "Club accounts delete own draft events"
on public.events for delete to authenticated
using (
  public.is_event_wall_club_account(club_id)
  and status = 'draft'
);

-- RLS is row-based. Restrict club accounts to profile columns at the grant
-- layer too, so a direct API call cannot change the admin-controlled slug or
-- active flag. Admin writes to these fields use the server-only service role.
revoke update on public.clubs from authenticated;
grant update (name, logo_url, description, contact_email, contact_phone)
on public.clubs to authenticated;

-- Public media URLs are used by the campus event wall. Upload and mutation
-- access remains protected by the object policies below.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('posters', 'posters', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('logos', 'logos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Club accounts read own media"
on storage.objects for select to authenticated
using (
  bucket_id in ('posters', 'logos')
  and case
    when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then public.is_event_wall_club_account(((storage.foldername(name))[1])::uuid)
    else false
  end
);

create policy "Club accounts upload own media"
on storage.objects for insert to authenticated
with check (
  bucket_id in ('posters', 'logos')
  and case
    when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then public.is_event_wall_club_account(((storage.foldername(name))[1])::uuid)
    else false
  end
);

create policy "Club accounts update own media"
on storage.objects for update to authenticated
using (
  bucket_id in ('posters', 'logos')
  and case
    when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then public.is_event_wall_club_account(((storage.foldername(name))[1])::uuid)
    else false
  end
)
with check (
  bucket_id in ('posters', 'logos')
  and case
    when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then public.is_event_wall_club_account(((storage.foldername(name))[1])::uuid)
    else false
  end
);

create policy "Club accounts delete own media"
on storage.objects for delete to authenticated
using (
  bucket_id in ('posters', 'logos')
  and case
    when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then public.is_event_wall_club_account(((storage.foldername(name))[1])::uuid)
    else false
  end
);
