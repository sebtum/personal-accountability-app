# ADR-010: Server Actions for Data Mutations

**Status:** Accepted  
**Date:** 2026-05-18

## Context

We need a strategy for form mutations (create, update, delete). Two options:

- **API Routes** (`/api/projects`, `/api/projects/[id]`) — classic REST endpoints, require `fetch()` calls from Client Components
- **Server Actions** — Next.js App Router feature: async functions marked `"use server"` that run on the server and can be referenced directly as `form action={fn}`

## Decision

Use Server Actions for all mutations. Actions live in `src/lib/actions/` and are imported into pages or passed as props to Client Component forms.

## Consequences

**Positive:**
- No API route boilerplate — no `NextRequest`, no `NextResponse`, no route files
- Type-safe end-to-end: the Server Action is a TypeScript function with typed parameters and return values
- `useActionState` (React 19) provides `isPending` for disabled submit buttons and the last error without manual state management
- `revalidatePath()` + `redirect()` handle cache invalidation and navigation in one call
- Serializable as RPC references — can be passed as props from Server Components to Client Components

**Tradeoffs:**
- Not independently callable via curl/Postman (no HTTP API exposure)
- `redirect()` inside an action throws a special error that breaks try/catch if not handled carefully — always call `redirect()` after error checks, not inside a try block

## Pattern

```typescript
// src/lib/actions/projects.ts
"use server";
export async function createProject(prevState, formData) {
  // validate → early return { error } on failure
  // mutate → revalidatePath + redirect on success
}

// src/components/projects/project-form.tsx
"use client";
const [state, formAction, pending] = useActionState(action, null);
<form action={formAction}>...</form>
```
