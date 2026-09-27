-- Fight Bracket — initial schema (M0/M1)
-- Organizers own championships; athletes register through a public RPC;
-- the public never reads tables directly (personal data / LGPD).

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.championship_status as enum (
  'draft',
  'registration_open',
  'registration_closed',
  'in_progress',
  'finished'
);

create type public.registration_status as enum ('pending', 'approved', 'rejected');

create type public.gender as enum ('male', 'female');

create type public.bracket_format as enum (
  'single_elimination',
  'repechage',
  'round_robin'
);

create type public.division_status as enum (
  'draft',
  'locked',
  'in_progress',
  'finished'
);

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));

create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Presets (owner_id null = built-in)
--
-- criteria shape (see apps/web/lib/criteria.ts):
--   { adultAge, belts: string[], ageCategories: [{ name, minAge, maxAge }] }
-- ---------------------------------------------------------------------------

create table public.presets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles (id) on delete cascade,
  name text not null,
  criteria jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.presets enable row level security;

create policy "presets: read built-in and own" on public.presets
  for select to authenticated
  using (owner_id is null or owner_id = (select auth.uid()));

create policy "presets: insert own" on public.presets
  for insert to authenticated with check (owner_id = (select auth.uid()));

create policy "presets: update own" on public.presets
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "presets: delete own" on public.presets
  for delete to authenticated using (owner_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Championships
-- ---------------------------------------------------------------------------

create table public.championships (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  event_date date not null,
  location text not null default '',
  status public.championship_status not null default 'draft',
  -- Snapshot of the preset criteria at creation; later preset edits don't leak in.
  criteria jsonb not null,
  public_slug text not null unique
    default substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
  created_at timestamptz not null default now()
);

create index championships_owner_id_idx on public.championships (owner_id);

alter table public.championships enable row level security;

create policy "championships: owner full access" on public.championships
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Divisions (bracket = @workspace/bracket-engine state; matches are derived)
-- ---------------------------------------------------------------------------

create table public.divisions (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null
    references public.championships (id) on delete cascade,
  name text not null,
  format public.bracket_format not null default 'single_elimination',
  third_place_match boolean not null default false,
  group_size int check (group_size is null or group_size >= 2),
  advance_per_group int check (advance_per_group is null or advance_per_group >= 1),
  status public.division_status not null default 'draft',
  bracket jsonb,
  created_at timestamptz not null default now()
);

create index divisions_championship_id_idx on public.divisions (championship_id);

alter table public.divisions enable row level security;

create policy "divisions: owner full access" on public.divisions
  for all to authenticated
  using (
    exists (
      select 1 from public.championships c
      where c.id = championship_id and c.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.championships c
      where c.id = championship_id and c.owner_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Registrations (athlete data frozen per championship)
-- ---------------------------------------------------------------------------

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null
    references public.championships (id) on delete cascade,
  division_id uuid references public.divisions (id) on delete set null,
  status public.registration_status not null default 'pending',
  full_name text not null check (length(trim(full_name)) > 0),
  birth_date date not null,
  gender public.gender not null,
  weight_kg numeric(5, 2) not null check (weight_kg > 0 and weight_kg < 400),
  belt text not null,
  academy text not null,
  coach text not null default '',
  phone text not null,
  email text not null,
  guardian_name text,
  guardian_phone text,
  consent_at timestamptz not null,
  guardian_consent_at timestamptz,
  created_at timestamptz not null default now()
);

create index registrations_championship_id_idx on public.registrations (championship_id);
create index registrations_division_id_idx on public.registrations (division_id);

alter table public.registrations enable row level security;

-- No insert policy: registrations come in only through submit_registration().
create policy "registrations: owner read" on public.registrations
  for select to authenticated
  using (
    exists (
      select 1 from public.championships c
      where c.id = championship_id and c.owner_id = (select auth.uid())
    )
  );

create policy "registrations: owner update" on public.registrations
  for update to authenticated
  using (
    exists (
      select 1 from public.championships c
      where c.id = championship_id and c.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.championships c
      where c.id = championship_id and c.owner_id = (select auth.uid())
    )
  );

create policy "registrations: owner delete" on public.registrations
  for delete to authenticated
  using (
    exists (
      select 1 from public.championships c
      where c.id = championship_id and c.owner_id = (select auth.uid())
    )
  );

-- Only status and division may change; athlete data is frozen.
create function public.registrations_freeze_athlete_data()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.championship_id, new.full_name, new.birth_date, new.gender,
      new.weight_kg, new.belt, new.academy, new.coach, new.phone, new.email,
      new.guardian_name, new.guardian_phone, new.consent_at,
      new.guardian_consent_at, new.created_at)
     is distinct from
     (old.championship_id, old.full_name, old.birth_date, old.gender,
      old.weight_kg, old.belt, old.academy, old.coach, old.phone, old.email,
      old.guardian_name, old.guardian_phone, old.consent_at,
      old.guardian_consent_at, old.created_at)
  then
    raise exception 'Athlete data cannot be changed after registration';
  end if;
  return new;
end;
$$;

create trigger registrations_freeze_athlete_data
  before update on public.registrations
  for each row execute function public.registrations_freeze_athlete_data();

-- ---------------------------------------------------------------------------
-- Public RPCs (anon)
-- ---------------------------------------------------------------------------

-- Public championship info by slug. No personal data.
create function public.get_public_championship(slug text)
returns table (
  name text,
  event_date date,
  location text,
  status public.championship_status,
  belts jsonb,
  adult_age int
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.name,
    c.event_date,
    c.location,
    c.status,
    coalesce(c.criteria -> 'belts', '[]'::jsonb),
    coalesce((c.criteria ->> 'adultAge')::int, 18)
  from public.championships c
  where c.public_slug = slug and c.status <> 'draft';
$$;

create function public.submit_registration(
  slug text,
  full_name text,
  birth_date date,
  gender public.gender,
  weight_kg numeric,
  belt text,
  academy text,
  coach text,
  phone text,
  email text,
  consent boolean,
  guardian_name text default null,
  guardian_phone text default null,
  guardian_consent boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  champ public.championships;
  adult_age int;
  is_minor boolean;
  new_id uuid;
begin
  select * into champ from public.championships c where c.public_slug = slug;

  if champ.id is null then
    raise exception 'championship_not_found';
  end if;
  if champ.status <> 'registration_open' then
    raise exception 'registration_closed';
  end if;
  if not coalesce(consent, false) then
    raise exception 'consent_required';
  end if;
  if not (champ.criteria -> 'belts') ? belt then
    raise exception 'invalid_belt';
  end if;

  -- Competition age by birth year (see @workspace/bracket-engine competitionAge).
  adult_age := coalesce((champ.criteria ->> 'adultAge')::int, 18);
  is_minor := extract(year from champ.event_date) - extract(year from birth_date) < adult_age;

  if is_minor and (
    nullif(trim(guardian_name), '') is null
    or nullif(trim(guardian_phone), '') is null
    or not coalesce(guardian_consent, false)
  ) then
    raise exception 'guardian_required';
  end if;

  insert into public.registrations (
    championship_id, full_name, birth_date, gender, weight_kg, belt, academy,
    coach, phone, email, guardian_name, guardian_phone, consent_at,
    guardian_consent_at
  ) values (
    champ.id, trim(full_name), birth_date, gender, weight_kg, belt,
    trim(academy), trim(coalesce(coach, '')), trim(phone), trim(email),
    case when is_minor then trim(guardian_name) end,
    case when is_minor then trim(guardian_phone) end,
    now(),
    case when is_minor then now() end
  )
  returning id into new_id;

  return new_id;
end;
$$;

revoke execute on function public.get_public_championship(text) from public;
revoke execute on function public.submit_registration(
  text, text, date, public.gender, numeric, text, text, text, text, text,
  boolean, text, text, boolean
) from public;

grant execute on function public.get_public_championship(text) to anon, authenticated;
grant execute on function public.submit_registration(
  text, text, date, public.gender, numeric, text, text, text, text, text,
  boolean, text, text, boolean
) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Built-in presets (belts and age groups; editable per championship later)
-- ---------------------------------------------------------------------------

insert into public.presets (owner_id, name, criteria) values
(null, 'Taekwondo (WT)', '{
  "adultAge": 18,
  "belts": ["Branca", "Amarela", "Verde", "Azul", "Vermelha", "Preta"],
  "ageCategories": [
    { "name": "Infantil", "minAge": 8, "maxAge": 11 },
    { "name": "Cadete", "minAge": 12, "maxAge": 14 },
    { "name": "Júnior", "minAge": 15, "maxAge": 17 },
    { "name": "Adulto", "minAge": 18, "maxAge": 32 },
    { "name": "Master", "minAge": 33, "maxAge": null }
  ]
}'),
(null, 'Jiu-Jitsu (IBJJF)', '{
  "adultAge": 18,
  "belts": ["Branca", "Cinza", "Amarela", "Laranja", "Verde", "Azul", "Roxa", "Marrom", "Preta"],
  "ageCategories": [
    { "name": "Infantil", "minAge": 4, "maxAge": 15 },
    { "name": "Juvenil", "minAge": 16, "maxAge": 17 },
    { "name": "Adulto", "minAge": 18, "maxAge": 29 },
    { "name": "Master", "minAge": 30, "maxAge": null }
  ]
}'),
(null, 'Judô', '{
  "adultAge": 18,
  "belts": ["Branca", "Cinza", "Azul", "Amarela", "Laranja", "Verde", "Roxa", "Marrom", "Preta"],
  "ageCategories": [
    { "name": "Sub-13", "minAge": 11, "maxAge": 12 },
    { "name": "Sub-15", "minAge": 13, "maxAge": 14 },
    { "name": "Sub-18", "minAge": 15, "maxAge": 17 },
    { "name": "Sub-21", "minAge": 18, "maxAge": 20 },
    { "name": "Sênior", "minAge": 21, "maxAge": 29 },
    { "name": "Veterano", "minAge": 30, "maxAge": null }
  ]
}'),
(null, 'Personalizado', '{
  "adultAge": 18,
  "belts": ["Iniciante", "Intermediário", "Avançado"],
  "ageCategories": [
    { "name": "Infantil", "minAge": 0, "maxAge": 17 },
    { "name": "Adulto", "minAge": 18, "maxAge": null }
  ]
}');
