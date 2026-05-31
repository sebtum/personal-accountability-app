# Personal Accountability App

A time-tracking and project accountability app. Track projects, break them into tasks with time estimates, log actual work hours, and visualize progress through charts.

Built as a Progressive Web App — installable on desktop and mobile.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 + shadcn/ui (base-nova) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (single pre-created user) |
| State | Zustand v5 (timer state) |
| Charts | Recharts |
| PWA | @ducanh2912/next-pwa |

## Features

**Dashboard**
- Stats overview: active projects, open tasks, today's logged hours, in-progress tasks
- "In Bearbeitung" task list with inline timer controls
- Recent activity feed showing the last time logs
- Charts: hours per week, hours per day (with week navigation), and hourly productivity distribution (sliding window: 1W / 2W / 1M / 3M)

**Projects**
- Create, edit, delete projects with name, description, status, start date, and deadline
- Status badges (aktiv / abgeschlossen / archiviert) with inline quick-select
- Clickable project cards linking to the detail view

**Tasks**
- Create, edit, delete tasks per project with name, description, estimated hours, and status
- JSONB checklist for sub-steps (check off items inline)
- Quick status dropdown directly in the task list
- Actual vs. estimated hours tracked via `task_actuals` view; overruns shown as warnings

**Timer**
- Start/stop timer on any task — creates a `time_log` row with `ended_at = NULL` while running
- Live elapsed-time display (client-side tick via Zustand)
- Manual time entry (set `is_manual = true`)
- Orphaned timer recovery: on app load, any open timer surfaces a modal asking "Bis wann hast du gearbeitet?" — user confirms, adjusts end time, or discards

## Data Model

```
Projects (Epics)
└── Tasks
    ├── estimated_hours
    ├── checklist (JSONB)
    └── Time Logs
        ├── started_at / ended_at
        └── duration_minutes
```

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Setup

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Copy the environment file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Credentials are in the Supabase Dashboard under **Project Settings → API**.

3. Run the database migration in the Supabase **SQL Editor**:

```bash
# Copy and execute the contents of:
supabase/migrations/001_initial_schema.sql
```

4. Create your user account in the Supabase Dashboard under **Authentication → Users → Add user**. No sign-up flow exists in the app by design.

5. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with the credentials you created in step 4.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build (webpack, required for PWA) |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Architecture Decisions

All architectural decisions are documented as ADRs in [`docs/adr/`](docs/adr/):

| ADR | Decision |
|-----|----------|
| [001](docs/adr/001-database-schema.md) | 3-level hierarchy + JSONB checklist |
| [002](docs/adr/002-authentication.md) | Single-user, pre-created account, RLS |
| [003](docs/adr/003-orphaned-timer-recovery.md) | Prompt-on-load for open timers |
| [004](docs/adr/004-burndown-formula.md) | Strict remaining-hours formula |
| [005](docs/adr/005-app-router.md) | Next.js App Router with route groups |
| [006](docs/adr/006-supabase-ssr.md) | Supabase SSR client strategy |
| [007](docs/adr/007-zustand.md) | Zustand for client-side timer state |
| [008](docs/adr/008-shadcn.md) | shadcn/ui with @base-ui/react |
| [009](docs/adr/009-pwa.md) | PWA via @ducanh2912/next-pwa |

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/          # Public login page
│   └── (app)/                 # Protected app shell
│       ├── page.tsx           # Dashboard
│       └── projects/          # Projects + Tasks CRUD
├── components/
│   ├── ui/                    # shadcn UI primitives
│   ├── dashboard/             # Chart + stat components
│   ├── projects/              # Project form, status select
│   ├── tasks/                 # Task form, checklist, status select
│   └── timer/                 # Timer button, manual log form, orphaned-timer modal
├── lib/
│   ├── supabase/              # Browser + server clients
│   ├── data/                  # Read-only data fetchers (Server Components)
│   └── actions/               # Server Actions (mutations)
├── store/                     # Zustand timer store
└── types/                     # TypeScript database types
```
