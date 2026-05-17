# ADR-008: shadcn/ui as Component Library

**Status:** Accepted  
**Date:** 2026-05-17

## Context

Building accessible UI primitives from scratch (modals, dropdowns, date pickers, badges) is time-consuming. A component library accelerates this. Options: shadcn/ui (copy-paste into codebase, Radix UI primitives, Tailwind styled), Headless UI (similar but fewer components), or pure Tailwind with no library.

## Decision

Use **shadcn/ui**. Components are copied into `src/components/ui/` — they live in the codebase and can be modified freely. No black-box component with a locked API.

Key components expected to be used:
- `Dialog` — timer recovery modal (ADR-003), task/project forms
- `Badge` — task status and overrun indicators
- `Card` — project and task cards
- `Progress` — estimated vs actual hours bar
- `Select` — task status dropdowns
- Charts via Recharts (shadcn chart primitives)

The `cn()` utility (`src/lib/utils.ts`) merges Tailwind classes and is the standard shadcn pattern.

## Consequences

- **Positive:** Accessible Radix UI primitives without writing ARIA attributes manually.
- **Positive:** All components are in-repo — no upstream API changes break the app.
- **Positive:** Recharts is included as the charting solution, covering the burndown chart (ADR-004).
- **Negative:** Each component must be explicitly added with `npx shadcn@latest add <component>` — not a full install. Acceptable overhead.
