# ADR-005: Next.js App Router (not Pages Router)

**Status:** Accepted  
**Date:** 2026-05-17

## Context

Next.js offers two routing paradigms: the legacy Pages Router and the current App Router (stable since Next.js 13.4). The choice affects the file structure, how server-side rendering works, and how Supabase auth sessions are handled. This project starts from scratch with no legacy constraints.

## Decision

Use the **App Router** with the `src/app/` directory. React Server Components are the default; client components are opt-in with `"use client"`.

Key layout:
```
src/app/
  layout.tsx          ← root HTML shell, PWA meta
  (auth)/login/       ← public login page
  (app)/layout.tsx    ← authenticated shell (nav header)
  (app)/page.tsx      ← dashboard at /
```

Route groups `(auth)` and `(app)` organize code without affecting URLs.

## Consequences

- **Positive:** Server Components fetch data without API routes, reducing round-trips for the dashboard.
- **Positive:** Native support for streaming, parallel routes, and intercepted routes if needed later.
- **Positive:** `@supabase/ssr` is designed for App Router — server-side session handling works out of the box.
- **Negative:** Mental model shift — any component using hooks, browser APIs, or event handlers must be explicitly marked `"use client"`. Forgetting this causes runtime errors.
