-- Keep cancelled/removed approved events out of student discovery while
-- retaining their history for administrators and the owning club.
alter table public.events drop constraint if exists events_status_check;
alter table public.events
  add constraint events_status_check
  check (status in ('draft', 'pending', 'approved', 'rejected', 'archived'));
