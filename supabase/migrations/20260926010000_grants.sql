-- Explicit table privileges for the Data API roles. New Supabase projects
-- don't auto-grant tables in `public`; RLS policies still decide which rows.
-- `anon` gets no table access: the public only uses the security definer RPCs.

grant select, update on table public.profiles to authenticated;

grant select, insert, update, delete on table public.presets to authenticated;
grant select, insert, update, delete on table public.championships to authenticated;
grant select, insert, update, delete on table public.divisions to authenticated;

-- No insert: registrations come in only through submit_registration().
grant select, update, delete on table public.registrations to authenticated;
