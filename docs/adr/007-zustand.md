# ADR-007: Zustand for Client-Side State Management

**Status:** Accepted  
**Date:** 2026-05-17

## Context

The app needs client-side state for the active timer (task ID + start timestamp). The timer ticks every second, so the state update rate is high. Two options were evaluated: React Context API (zero dependency) and Zustand (lightweight external library).

The core risk with Context: any component subscribed to a context re-renders on every state change. A ticking timer in a high-level context would re-render the entire component tree once per second, which is wasteful.

## Decision

Use **Zustand v5**. The timer store lives in `src/store/index.ts` and exports `useTimerStore`. Components subscribe to only the slices they need, preventing unnecessary re-renders.

```typescript
// Only subscribes to activeTaskId — won't re-render when timerStartedAt ticks
const activeTaskId = useTimerStore((s) => s.activeTaskId);
```

No store provider is needed. Zustand's default export is a singleton — safe for a single-user app with no SSR state sharing requirements. All store-consuming components are Client Components.

## Consequences

- **Positive:** Granular subscriptions — timer tick re-renders only the clock display component, not the task list.
- **Positive:** Zero boilerplate; no Provider wrapper needed in the root layout.
- **Negative:** Extra dependency (though tiny at ~1kb gzipped). Accepted.
- **Future:** Zustand's `persist` middleware can later be used to survive page refreshes (store timer start in localStorage as a fallback for orphaned-timer detection per ADR-003).
