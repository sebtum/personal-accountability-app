# ADR-001: Three-Level Database Schema with JSONB Checklist

**Status:** Accepted  
**Date:** 2026-05-17

## Context

The app models personal work across three granularity levels: projects (multi-week goals with deadlines), tasks (concrete work blocks with time estimates), and time logs (raw time records). A fourth potential level — sub-tasks — was considered to support checklist-style breakdowns within a task.

The primary concern was keeping the schema lean enough to run comfortably on Supabase's free tier while avoiding query complexity overhead.

## Decision

Use exactly three database tables (`projects`, `tasks`, `time_logs`) with no fourth table for sub-tasks. Instead, each task stores an optional checklist as a JSONB column with the shape:

```json
[
  { "id": "uuid", "text": "Write tests", "completed": false },
  { "id": "uuid", "text": "Update docs", "completed": true }
]
```

A `task_actuals` view aggregates `actual_hours` and `is_overrun` per task to keep dashboard queries simple.

`duration_minutes` is stored explicitly on each `time_log` row (not derived from `ended_at - started_at`) so that values remain stable and fast to query even if timestamps are later corrected.

## Consequences

- **Positive:** No JOIN needed to fetch a task with its checklist items. Fewer tables = simpler RLS policies and fewer indexes.
- **Positive:** Checklist reordering and in-place edits are a single `UPDATE tasks SET checklist = $1`.
- **Negative:** Checklist items cannot be queried individually in SQL (e.g., "how many items are completed across all tasks"). Acceptable since no such aggregate is required.
- **Negative:** JSONB has no foreign-key enforcement; checklist integrity is the application's responsibility.
