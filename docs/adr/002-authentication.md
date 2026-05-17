# ADR-002: Single-User Authentication via Supabase Email + Password

**Status:** Accepted  
**Date:** 2026-05-17

## Context

The app is designed for exactly one user. A full multi-user auth system (sign-up flow, email verification, password reset, invite codes) would add complexity with zero benefit. However, deploying with no authentication at all would expose the app to anyone who discovers the URL.

## Decision

Use Supabase's built-in Email + Password authentication with a single account pre-created via the Supabase Dashboard (Authentication → Users → Add user). The app exposes no sign-up route.

**Setup steps (one-time, manual):**
1. In the Supabase Dashboard, add a user with your email and a strong password.
2. Optionally disable new sign-ups in Dashboard → Authentication → Settings → "Disable sign-ups" to prevent any account creation through the API.

**App-level enforcement:**
- `middleware.ts` in Next.js checks for a valid Supabase session on every request and redirects unauthenticated traffic to `/login`.
- The `/login` page renders only an email + password form. No sign-up link.

**Database-level enforcement (Row Level Security):**
All three tables have RLS enabled with the policy `auth.role() = 'authenticated'`. Because only one account exists, authenticated = this user.

Optional hardening: set `NEXT_PUBLIC_OWNER_UID` in `.env.local` and tighten the RLS policy to `auth.uid() = $OWNER_UID::uuid` to ensure even a leaked JWT from a hypothetical second account cannot access data.

## Consequences

- **Positive:** Zero maintenance — no sign-up/reset flows to build or secure.
- **Positive:** Real JWT-based sessions; Supabase handles token refresh automatically.
- **Positive:** PWA on mobile can persist the session just like a native app.
- **Negative:** Password recovery requires going to the Supabase Dashboard (or using Supabase's "Send password reset" button). Acceptable for a personal tool.
- **Negative:** If the Supabase project is ever shared with another user, all data becomes visible to them unless the optional UID-scoped RLS policy is in place.
