# ADR-004: Strict Burndown Formula (Remaining = Estimated Until Done)

**Status:** Accepted  
**Date:** 2026-05-17

## Context

The burndown chart's Y-axis represents remaining estimated hours for a project. A task that is `in_progress` and has already logged more time than its estimate (overrun) creates an ambiguity: should remaining hours for that task drop to zero (optimistic), or stay at the full estimate until the task is explicitly marked `done` (strict)?

Two formulas were considered:

**Strict:**
```sql
remaining = SUM(estimated_hours) WHERE status != 'done'
```

**Optimistic:**
```sql
remaining = SUM(GREATEST(0, estimated_hours - actual_hours)) WHERE status != 'done'
```

## Decision

**Strict formula.**

A task's contribution to remaining hours does not change based on time logged — it only drops when the task status changes to `done`. Overrunning an estimate surfaces exclusively as a red overrun warning on the task card (via `task_actuals.is_overrun`), not as a silent reduction in remaining hours.

## Consequences

- **Positive:** The burndown line is a reliable indicator of *completion*, not effort. A flat burndown line means tasks aren't being closed — a clear planning signal.
- **Positive:** Prevents a false sense of progress: logging 10 hours on a 5-hour task does not make the project look 5 hours closer to done.
- **Negative:** The burndown line can go flat or even rise if new tasks are added mid-project. This is the correct behavior — it reflects reality — but may look alarming at first glance.
- **Negative:** A severely overrun task inflates the remaining hours number even if the work is effectively complete. The mitigation is discipline: mark tasks `done` promptly.
- **Relationship to ADR-001:** The `task_actuals` view computes `is_overrun` independently of this formula. The overrun flag is orthogonal to remaining-hours calculation; both signals are shown simultaneously in the UI.
