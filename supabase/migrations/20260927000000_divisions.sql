-- Divisions (M2/M3): auto-grouping key + public bracket view.

-- Criteria combination of an auto-generated division (gender|ageCategory|belt).
-- Null for divisions the organizer created by hand.
alter table public.divisions add column group_key text;

create unique index divisions_championship_group_key_idx
  on public.divisions (championship_id, group_key)
  where group_key is not null;

-- Public divisions with a bracket, and only the athletes' name and academy.
create function public.get_public_divisions(slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', d.id,
        'name', d.name,
        'status', d.status,
        'bracket', d.bracket,
        'athletes', (
          select coalesce(
            jsonb_agg(
              jsonb_build_object(
                'id', r.id,
                'name', r.full_name,
                'academy', r.academy
              )
            ),
            '[]'::jsonb
          )
          from public.registrations r
          where r.division_id = d.id and r.status = 'approved'
        )
      )
      order by d.name
    ),
    '[]'::jsonb
  )
  from public.divisions d
  join public.championships c on c.id = d.championship_id
  where c.public_slug = slug
    and c.status <> 'draft'
    and d.bracket is not null;
$$;

revoke execute on function public.get_public_divisions(text) from public;
grant execute on function public.get_public_divisions(text) to anon, authenticated;

-- Trigger function only; not callable through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
