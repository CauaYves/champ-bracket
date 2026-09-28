# Fight Bracket — Product Spec

Status: draft v1 (2026-09-26)

## Problem

Martial arts teachers build championship brackets by hand, which takes hours. This app automates the full flow: athletes register themselves via QR code, the organizer approves them, divisions are generated, brackets are drawn, results are recorded live, and anyone can follow along on a public link.

## Decisions

| Topic | Decision |
|---|---|
| Sport | Generic (any martial art). Rules come from **category presets** (e.g. WT Taekwondo, IBJJF, Judo) that the organizer picks and tweaks, or builds from scratch. |
| Users | Multi-tenant: any teacher can sign up and run their own championships. Data is isolated per organizer. |
| Public | Viewers (athletes, parents) follow brackets via a **shareable unlisted link per championship** (also offered as a QR code). No public directory. |
| Registration | Athlete scans a **QR code**, which opens a public signup form. Each registration stays `pending` until the organizer **approves** it. |
| Divisions | Auto-grouped from the preset criteria, then adjusted manually by the organizer. |
| Seeding | **Random initial draw with automatic byes**. The organizer then rearranges with **drag & drop**. |
| Results | **Winner only** (no score or method). Recording a winner advances the bracket, and the public page updates in real time. |
| Backend | Supabase: Postgres, Auth, Realtime, and RLS. |
| Language | UI in **pt-BR only**. |
| Event day | Print / PDF export of brackets. |

## Registration form fields

- Full name, birth date, gender, weight (kg)
- Belt / rank (options come from the championship preset)
- Academy / team, coach name
- Phone, email
- Guardian name + phone, **required when the athlete is a minor** on the event date

## Bracket formats

### 1. Single elimination (MVP)

- Bracket size = next power of 2 ≥ N. Byes = size − N.
- Athletes are shuffled randomly. Byes go to standard seed positions, so they are spread evenly and never meet each other. A bye athlete advances to round 2 automatically.
- Default: the two semifinal losers each get **bronze**. Per division, the organizer can turn on a **3rd-place match** instead.
- Drag & drop is allowed while the division bracket is unlocked, before any result has been recorded.

### 2. Single elimination with repechage (Olympic/WT)

- Once both finalists are known, every athlete who lost to **finalist A** in any earlier round enters repechage side A. The same applies to side B.
- Each side is a ladder: the earliest-round losers fight first, and each winner faces the next loser, ending with the semifinal loser. Each side's final winner takes **bronze** (2 bronzes total).
- A side with no eligible losers (because of byes) gives no bronze on that side, or gives it directly to the semifinal loser if they are the only one.

### 3. Round robin → elimination

- The organizer sets the group size and how many advance per group (e.g. top 2).
- Within a group, everyone fights everyone. Ranking is by wins.
- **Tiebreak**: head-to-head for 2-way ties. For 3+ way ties, the app flags the tie and the organizer sets the order.
- Qualifiers feed a single-elimination bracket. Group winners are spread apart, and athletes from the same group are placed on opposite halves when possible.

## Core flow

1. Organizer signs up and creates a championship (name, date, location, preset).
2. Organizer opens registration. The app shows a QR code and link to the public form.
3. Athletes register. The organizer approves or rejects each one.
4. Organizer closes registration and generates divisions (auto-group, then manual merge, split, or move).
5. For each division: pick the format, generate the bracket, adjust by drag & drop, then lock it.
6. Event day: click the winner of each match. The bracket advances and the public link updates live.
7. Print or export brackets and final results per division.

## Architecture

- `apps/web`: Next.js 16 App Router. Organizer dashboard (authenticated), public registration form, public championship view.
- `packages/ui`: shared shadcn/ui (Base UI) components.
- **`packages/bracket-engine`** (new): pure TypeScript with no React or DB dependencies. It handles division grouping, bracket generation, bye placement, winner advancement, repechage, round-robin ranking, and tiebreaks. It is fully unit-tested with Vitest. The app persists the engine output and never duplicates its logic.
- Supabase: RLS limits organizers to their own championships. Public read access goes through the championship's public slug. Public insert is allowed only on registrations for championships whose registration is open.
- Realtime: public pages subscribe to `matches` changes for the championship.
- PDF: start with print stylesheets (browser "Save as PDF"). Consider `@react-pdf/renderer` only if print CSS isn't enough.

## Data model (sketch)

- `profiles`: organizer (1:1 with `auth.users`)
- `championships`: owner_id, name, date, location, status (`draft` → `registration_open` → `registration_closed` → `in_progress` → `finished`), `criteria` (jsonb snapshot of the preset), public_slug, registration_token
- `presets`: owner_id (null = built-in), name, `criteria` jsonb (genders, age categories, weight classes per gender/age, belt list, minor age)
- `registrations`: championship_id, athlete fields, status (`pending` / `approved` / `rejected`), division_id
- `divisions`: championship_id, name, format (`single_elimination` / `repechage` / `round_robin`), third_place_match, group_size, advance_per_group, status (`draft` / `locked` / `in_progress` / `finished`), `bracket` (jsonb: the `@workspace/bracket-engine` state, i.e. `entries` + `results`). There is **no matches table**: matches are derived by the engine.
- The public never reads tables directly. It goes through `security definer` RPCs (`get_public_championship`, `submit_registration`), so contact data stays private to the organizer.

Schema: `supabase/migrations/`.

## Milestones

1. **M0 – Foundation**: Supabase project, schema + RLS, auth, `bracket-engine` package with Vitest.
2. **M1 – Championships & registration**: championship CRUD, presets, QR code + public form, approval queue.
3. **M2 – Divisions**: auto-grouping from criteria, manual merge, split, and move.
4. **M3 – Single elimination**: generation with byes, drag & drop, lock, result recording with undo, live public view, print.
5. **M4 – Repechage.**
6. **M5 – Round robin → elimination.**

## Rules settled (2026-09-26)

- **Age**: by **birth year**. Age = championship year − birth year.
- **Athlete data is frozen per championship**: registration data (weight, belt, age, …) is a snapshot owned by the championship. Once brackets exist it does not change. There is no reclassification or weigh-in flow.
- **Undo**: a result can always be changed, even after later matches were decided. Changing a winner **cascades**: every downstream match the old winner reached is cleared back to that point, after the organizer confirms which results will be lost.
- **Single-athlete divisions**: the athlete **waits to be paired**, and the division stays open (not auto-gold). The division page shows "Aguardando adversário" and can't be drawn until the organizer moves an athlete in from another division, or a late registration is approved and assigned.
- **Auto-grouping** (`groupAthletes` in the engine): by gender + age category (birth year) + belt. Weight is **not** grouped yet. The organizer splits by weight by creating manual divisions and moving athletes. Auto divisions are identified by `divisions.group_key`, so "Gerar divisões" only places athletes not yet in a division and never touches divisions whose bracket is drawn.
- **Division lifecycle**: `draft` (athletes can move; bracket can be drawn, redrawn, rearranged by drag & drop or "Trocar", or discarded) → "Iniciar lutas" → `in_progress` (record winners, undo with cascade confirmation) → `finished` automatically when the final has a winner (back to `in_progress` if a result is undone). Public pages show only divisions past `draft`, refreshing every 15 s while the championship is `in_progress`.
- **LGPD**: the form requires a consent checkbox (with a link to the privacy notice). For minors, the guardian's name, phone, and a guardian consent checkbox are mandatory. Consent is stored with a timestamp.

## Out of scope

- Registration fees / payments, weigh-in.
