-- Read-only production audit. Run in Supabase SQL Editor after selecting the
-- production project. Compare each definition with migrations 0001-0004.
select version, name
from supabase_migrations.schema_migrations
order by version;

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check as check_expression
from pg_policies
where (schemaname = 'public' and tablename in ('clubs', 'admins', 'club_accounts', 'categories', 'events'))
   or (schemaname = 'storage' and tablename = 'objects'
       and policyname in ('Club accounts read own media', 'Club accounts upload own media', 'Club accounts update own media', 'Club accounts delete own media'))
order by schemaname, tablename, policyname;

-- RLS must be enabled on every app table and storage.objects.
select n.nspname as schema_name, c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where (n.nspname = 'public' and c.relname in ('clubs', 'admins', 'club_accounts', 'categories', 'events'))
   or (n.nspname = 'storage' and c.relname = 'objects')
order by n.nspname, c.relname;
