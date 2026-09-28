-- Public event cards and filters display category names without a user session.
grant select on public.categories to anon;
create policy "Public can view categories"
on public.categories for select to anon
using (true);
