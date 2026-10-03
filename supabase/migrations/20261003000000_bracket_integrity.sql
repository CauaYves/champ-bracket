-- Bracket integrity (code review): cheap "is drawn" flag and race-free guards
-- between drawing a bracket and rejecting/moving its athletes.

-- Lets pages and actions check "is drawn" without fetching the bracket JSON.
alter table public.divisions
  add column has_bracket boolean generated always as (bracket is not null) stored;

-- An athlete in a drawn bracket can't be rejected or moved out of it.
-- FOR SHARE on the division waits for a concurrent bracket write to commit,
-- so "check, then update" can't interleave with drawBracket.
create function public.registrations_protect_drawn_bracket()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.division_id is not null
     and (new.division_id is distinct from old.division_id
          or new.status <> 'approved')
  then
    perform 1
    from public.divisions d
    where d.id = old.division_id and d.bracket is not null
    for share;

    if found then
      raise exception 'athlete_in_drawn_bracket';
    end if;
  end if;
  return new;
end;
$$;

create trigger registrations_protect_drawn_bracket
  before update of division_id, status on public.registrations
  for each row execute function public.registrations_protect_drawn_bracket();

-- A bracket may only reference the division's approved athletes. Runs after
-- the division row is locked, so it sees any rejection that won the race.
create function public.divisions_validate_bracket()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.bracket is not null
     and new.bracket is distinct from old.bracket
     and exists (
       select 1
       from jsonb_array_elements_text(new.bracket -> 'entries') as e(athlete_id)
       where e.athlete_id is not null
         and not exists (
           select 1
           from public.registrations r
           where r.id = e.athlete_id::uuid
             and r.division_id = new.id
             and r.status = 'approved'
         )
     )
  then
    raise exception 'bracket_has_invalid_athletes';
  end if;
  return new;
end;
$$;

create trigger divisions_validate_bracket
  before update of bracket on public.divisions
  for each row execute function public.divisions_validate_bracket();

revoke execute on function public.registrations_protect_drawn_bracket()
  from public, anon, authenticated;
revoke execute on function public.divisions_validate_bracket()
  from public, anon, authenticated;
