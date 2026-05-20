# ADR-011: Checklist Form Strategy — JSON Hidden Input

**Status:** Accepted  
**Date:** 2026-05-20

## Context

Tasks have a `checklist` field stored as `JSONB` (`ChecklistItem[]`). The create/edit
form needs to allow users to add, remove, and name checklist items dynamically.

We need a strategy to transmit a variable-length, structured list through an HTML form
to a Server Action.

## Options Considered

**A — Multiple named inputs:** `checklist[0][text]`, `checklist[1][text]`, etc.
- Native HTML, no JS needed
- Complex and fragile parsing on the server; ordering is not guaranteed in FormData

**B — JSON hidden input:** A single `<input type="hidden" name="checklist">` whose
`value` is the JSON-serialized `ChecklistItem[]`, kept in sync with React state.
- Simple server parsing (`JSON.parse`)
- Requires JavaScript in the browser (acceptable for a PWA)

## Decision

Use a JSON hidden input (Option B).

The `TaskForm` client component maintains checklist items in `useState`. The hidden
input renders with `value={JSON.stringify(items)}`. Because React re-renders the
component synchronously whenever state changes, the hidden input's value is always
current when the form is submitted via `useActionState`.

## Consequences

- **Simple server action:** `JSON.parse(formData.get("checklist"))` — one line
- **No empty-item persistence:** Items with empty text are filtered out before
  serialization — `checklist.filter(item => item.text.trim() !== "")`
- **IDs:** New items get a `crypto.randomUUID()` ID in the browser. Existing items
  retain their database IDs across edits to preserve the `completed` state
- **Tradeoff:** Without JS the form would submit `"[]"` for the checklist — acceptable
  since this is a PWA where JS is required anyway
