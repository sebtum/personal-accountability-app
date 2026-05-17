# ADR-006: Supabase @supabase/ssr for Client Utilities

**Status:** Accepted  
**Date:** 2026-05-17

## Context

Supabase provides multiple client packages. `@supabase/supabase-js` alone works fine for client-side apps but doesn't handle server-side session persistence in Next.js App Router (session cookies aren't automatically forwarded to Server Components). The older `@supabase/auth-helpers-nextjs` is deprecated.

## Decision

Use **`@supabase/ssr`** (the current official package) with two separate factory functions:

| File | Used in |
|------|---------|
| `src/lib/supabase/client.ts` — `createBrowserClient` | Client Components (`"use client"`) |
| `src/lib/supabase/server.ts` — `createServerClient` + cookie store | Server Components, layouts, Route Handlers |

`middleware.ts` uses its own inline `createServerClient` to refresh session tokens on every request, which keeps the JWT alive without requiring client-side polling.

Both factory functions are typed with `Database` from `src/types/database.ts` for full end-to-end type safety.

## Consequences

- **Positive:** Session cookies are refreshed server-side before every render — no stale token issues on mobile PWA after long idle periods.
- **Positive:** All Supabase queries in Server Components have access to the authenticated user without extra API calls.
- **Negative:** Two import paths (`@/lib/supabase/client` vs `@/lib/supabase/server`) — devs must choose the right one. Using the server client in a `"use client"` component causes an error.
