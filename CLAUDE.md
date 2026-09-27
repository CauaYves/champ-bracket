# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Next.js version warning

This repo uses **Next.js 16.3** with React 19.2. APIs, conventions, and file structure may differ from your training data. Before writing Next.js code, read the relevant guide in `apps/web/node_modules/next/dist/docs/` (`01-app`, `03-architecture`, …) and follow any deprecation notices (see `AGENTS.md`).

## Commands

pnpm (v10) workspace orchestrated by Turborepo. Run from the repo root:

```bash
pnpm install
pnpm dev          # turbo dev — Next.js dev server for apps/web
pnpm build        # turbo build
pnpm lint         # turbo lint (ESLint 9 flat config)
pnpm typecheck    # turbo typecheck (tsc --noEmit per package)
pnpm format       # turbo format (Prettier, writes files)
```

Scope to a single package with a filter, e.g. `pnpm turbo lint --filter=@workspace/ui` or `pnpm --filter web dev`.

Tests use Vitest (currently only in `packages/bracket-engine`):

```bash
pnpm test                                               # all packages via turbo
pnpm --filter @workspace/bracket-engine test:watch      # watch mode
pnpm --filter @workspace/bracket-engine exec vitest run -t "cascades"   # single test by name
```

## Product spec

`docs/SPEC.md` is the source of truth for product decisions (formats, registration flow, data model, milestones). Read it before building features.

## Architecture

- `apps/web` — the Next.js App Router app (`app/`, plus `components/`, `hooks/`, `lib/` for app-specific code, imported via the `@/*` alias).
- `packages/ui` (`@workspace/ui`) — shared shadcn/ui design system. It is **not built**: it ships raw TS/TSX source via `exports` (`./components/*`, `./hooks/*`, `./lib/*`, `./globals.css`), and `apps/web/next.config.ts` lists it in `transpilePackages`. `apps/web/tsconfig.json` also maps `@workspace/ui/*` directly to `packages/ui/src/*`.
- `packages/bracket-engine` (`@workspace/bracket-engine`) — pure TypeScript bracket logic (draw, byes, results, undo cascade, placements), with no React/DB deps. Like `ui`, it ships raw source. A bracket is stored as data (`entries` + `results` keyed by match id). Matches, statuses and advancement are **derived** by `getMatches()`, never stored. Changing a result drops every later result whose two fighters changed; `recordWinner()` returns those ids as `cleared`. All bracket rules belong here, not in the app.
- `packages/eslint-config` (`./base`, `./next-js`, `./react-internal`) and `packages/typescript-config` (`base`, `nextjs`, `react-library`) hold the shared lint and TS presets.

### Supabase

- Schema, RLS and RPCs live in `supabase/migrations/` (applied through the Supabase MCP server configured in `.mcp.json`). Env vars: see `apps/web/.env.example`.
- Clients: `lib/supabase/server.ts` (`createClient()`, `getUserId()` for Server Components/Actions), `lib/supabase/client.ts` (browser), `lib/supabase/proxy.ts` (session refresh + redirect of unauthenticated `/campeonatos/*`, wired in `apps/web/proxy.ts`, which replaces Next's `middleware`).
- `lib/supabase/database.types.ts` is the `Database` type; regenerate it after schema changes.
- Organizers access their own rows via RLS (`owner_id = auth.uid()`). Public pages (`/c/[slug]`) and the QR registration form only use `security definer` RPCs, never direct table reads. Registration athlete data is immutable (DB trigger); only `status`/`division_id` change.
- Server Actions re-check auth (`requireUser()`) and validate with zod; forms use `useActionState` with the `FormState` shape in `lib/form-state.ts`.

### UI rule

Use stock shadcn components only. Don't edit `packages/ui/src/components/*`, and don't add custom colors, typography or decorative classes. `className` is for layout only (flex/grid/gap/padding/width). UI copy is pt-BR.

### shadcn/ui setup

- Style `base-sera`, components built on **Base UI** (`@base-ui/react`), not Radix. Keep that in mind when writing component APIs (e.g. `render` props instead of `asChild`).
- Add components from the repo root with `pnpm dlx shadcn@latest add <component> -c apps/web`. Generated primitives go into `packages/ui/src/components/`; import them as `@workspace/ui/components/<name>`.
- `cn` comes from the `cn` npm package, re-exported by `@workspace/ui/lib/utils`.

### Styling

- Tailwind CSS v4, configured CSS-first in `packages/ui/src/styles/globals.css` (no `tailwind.config`). Theme tokens are oklch CSS variables in `:root` / `.dark`. `@source` directives there scan `apps/**`, so new app directories are picked up automatically.
- The root layout imports `@workspace/ui/globals.css` and sets font CSS variables (`--font-sans` Noto Sans, `--font-heading` Playfair Display, `--font-mono` Geist Mono).
- Dark mode uses `next-themes` with the `class` attribute. `apps/web/components/theme-provider.tsx` also binds the `d` key to toggle the theme when focus is not in a text input.

### Formatting conventions

Prettier: no semicolons, double quotes, `trailingComma: es5`, 80 cols, LF line endings, and `prettier-plugin-tailwindcss` sorting classes inside `cn(...)` / `cva(...)`.

## Agent skills

Project skills live in `.agents/skills/` (tracked in `skills-lock.json`): `turborepo`, `shadcn`, `frontend-design`, `vercel-react-best-practices`, `find-skills`. When working in those areas, read the matching `SKILL.md`.
