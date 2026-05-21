# Personal Accountability App

Single-user time-tracking app. Track projects, tasks, and time logs. Built for one account only — no multi-tenancy.

## Tech Stack
- **Next.js 16** (App Router, React Server Components, Server Actions)
- **TypeScript** strict mode
- **Tailwind CSS** + shadcn/ui components
- **Supabase** (PostgreSQL + Auth)
- **Zustand 5** (client state — timer only)
- **Recharts** (charts, not yet used)
- CI via GitHub Actions (`.github/workflows/ci.yml`)

## Commands
```
npm run dev      # dev server (Turbopack)
npm run build    # production build + type check (webpack)
npm run lint     # ESLint
```

## Directory Structure
```
src/
  app/
    (auth)/login/          # public login page
    (app)/                 # auth-guarded layout
      page.tsx             # dashboard (placeholder)
      projects/
        page.tsx           # project list
        new/page.tsx       # create project
        [id]/
          page.tsx         # project detail + task list
          edit/page.tsx    # edit project
          tasks/
            new/page.tsx
            [taskId]/edit/page.tsx
  components/
    ui/                    # button, input, label, textarea, select
    projects/project-form.tsx
    tasks/task-form.tsx
    nav-links.tsx
  lib/
    supabase/
      client.ts            # browser client
      server.ts            # server client (cookies)
    data/
      projects.ts          # getProjects, getProject
      tasks.ts             # getTasksByProject, getTask
    actions/
      auth.ts              # logout
      projects.ts          # createProject, updateProject, deleteProject
      tasks.ts             # createTask, updateTask, deleteTask
    utils.ts               # cn()
  store/index.ts           # Zustand timer store (useTimerStore)
  types/database.ts        # Database interface + helper types
```

## Database Schema

Three tables (all with RLS: authenticated users have full access):

**projects** — `id, name, description, status(active|completed|archived), start_date(DATE), deadline(DATE), created_at, updated_at`

**tasks** — `id, project_id(→projects), name, description, status(todo|in_progress|done), estimated_hours(NUMERIC), checklist(JSONB: [{id,text,completed}]), created_at, updated_at`

**time_logs** — `id, task_id(→tasks), started_at(TIMESTAMPTZ), ended_at(TIMESTAMPTZ|NULL), duration_minutes(NUMERIC|NULL), notes, is_manual(BOOL), created_at`
- `ended_at IS NULL` → timer currently running (orphaned timer recovery needed on load)

**View: task_actuals** — `task_id, project_id, name, status, estimated_hours, actual_hours, is_overrun`

TypeScript types in `src/types/database.ts` — use `Database["public"]["Tables"]["projects"]["Row"]` etc.

## Authentication
Single user, pre-created in Supabase Dashboard. No signup flow.
- Auth guard: `src/app/(app)/layout.tsx` checks session, redirects to `/login` if missing
- `middleware.ts` also protects routes
- RLS policy: `authenticated` role has full access (no UUID check needed — only one account)

## Code Conventions
- **Server Components** for all data fetching (`async` page components calling `lib/data/*.ts`)
- **Server Actions** (`"use server"`) for all mutations; use `useActionState` + `useFormStatus` in forms
- **No API routes** — everything goes through Server Actions or Server Components
- Forms use `(prevState, formData) => Promise<ActionState>` signature with `useActionState`
- After mutations: `revalidatePath(...)` then `redirect(...)`
- Supabase client: always `await createClient()` from `@/lib/supabase/server` in server context
- Date format in UI: `DD.MM.YYYY` (German locale)
- UI language: German throughout

## Zustand Store (`src/store/index.ts`)
```ts
useTimerStore: { activeTaskId, timerStartedAt, startTimer(taskId), stopTimer() }
```
Timer state is client-only (not persisted). On stop, a Server Action writes to `time_logs`.

## Completed Features
1. Auth (login/logout, session guard)
2. Projects CRUD (list, create, edit, delete) with status badges
3. Tasks CRUD (list per project, create, edit, delete) with checklist (JSONB), estimated hours, status

## Next Feature: Timer
**Orphaned timer recovery (ADR-003):** On app load, detect any `time_log` where `ended_at IS NULL`. Show a modal: "Du hattest einen offenen Timer seit [started_at]. Bis wann hast du gearbeitet?" — user confirms current time, enters custom end time, or discards.

**Timer flow:**
1. User clicks "Start" on a task → `startTimer(taskId)` in Zustand + insert `time_log` row with `ended_at = NULL`
2. Running timer shows elapsed time (client-side tick)
3. User clicks "Stop" → Server Action updates `time_log` with `ended_at` + `duration_minutes`

**Manual time entry:** Form to log time without timer (set `is_manual = true`)

## Key Architectural Decisions
- **Checklist as JSONB** (not a separate table) — sub-steps don't need relational queries
- **Burndown formula (strict):** `remaining = SUM(estimated_hours) WHERE status != 'done'` — a task counts its full estimate until marked done; overruns show as red warnings, not reduced remaining
- **Single-user RLS** — no per-user UUID in policies; `authenticated` role is sufficient

## CI
`.github/workflows/ci.yml` — runs `npm run lint` + `npm run build` on push/PR to main.
Requires GitHub Secrets: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
Node.js 22 LTS; `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` set.
