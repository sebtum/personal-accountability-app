# ADR-003: Orphaned Timer Recovery via Prompt on Load

**Status:** Accepted  
**Date:** 2026-05-17

## Context

When a timer starts, a `time_log` row is immediately inserted with `started_at` set and `ended_at = NULL`. If the browser tab closes, the device loses power, or a crash occurs before the timer is stopped, that row remains open indefinitely. Without a recovery mechanism, the `task_actuals` view silently excludes the orphaned log (it filters `ended_at IS NOT NULL`), causing lost time data.

Three options were evaluated:
- **A (Prompt):** On every app load, detect orphaned rows and ask the user to confirm or discard.
- **B (Auto-close):** Silently set `ended_at = now()` at next login.
- **C (Discard):** Delete orphaned rows at next login.

## Decision

**Option A — Prompt on load.**

On app initialization (before rendering the main UI), query for any `time_log` where `ended_at IS NULL`. If one or more are found, show a blocking recovery modal for each:

> "You have an open timer on **[task name]** started at **[started_at]**.  
> Did you work until now?  
> [Set end to now] [Enter custom end time] [Discard]"

The user's explicit choice is required before the app proceeds. No data is mutated silently.

## Consequences

- **Positive:** No data loss; the user decides what happened.
- **Positive:** Correct time data — auto-closing with `now()` would inflate duration for timers that crashed hours ago.
- **Negative:** Adds a startup step on the rare occasion a crash occurs. Acceptable friction for data accuracy.
- **Implementation note:** The recovery check must run server-side (in the root layout or a dedicated hook) before the timer UI is rendered, to avoid a race condition where a new timer is started while an orphaned one is still open. The schema constraint `timer_state_consistency` does not enforce only-one-running-timer at the DB level, so the application must enforce this.
