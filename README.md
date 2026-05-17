# Personal Accountability App

A single-user time-tracking and project accountability app. Track projects, break them into tasks with time estimates, log actual work hours, and visualize progress through burndown charts.

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
│   ├── (auth)/login/     # Public login page
│   └── (app)/            # Protected app shell
├── components/ui/        # shadcn UI components
├── lib/supabase/         # Browser + server Supabase clients
├── store/                # Zustand timer store
└── types/                # TypeScript database types
```
