-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE project_status AS ENUM ('active', 'completed', 'archived');
CREATE TYPE task_status    AS ENUM ('todo', 'in_progress', 'done');

-- ============================================================
-- PROJECTS / EPICS
-- ============================================================
CREATE TABLE projects (
  id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT           NOT NULL,
  description TEXT,
  status      project_status NOT NULL DEFAULT 'active',
  start_date  DATE           NOT NULL,
  deadline    DATE           NOT NULL,
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ    NOT NULL DEFAULT now(),

  CONSTRAINT deadline_after_start CHECK (deadline >= start_date)
);

-- ============================================================
-- TASKS
-- Checklist stored as JSONB: [{id: string, text: string, completed: boolean}]
-- No separate table — avoids relational overhead for sub-steps.
-- ============================================================
CREATE TABLE tasks (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID         NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name            TEXT         NOT NULL,
  description     TEXT,
  status          task_status  NOT NULL DEFAULT 'todo',
  estimated_hours NUMERIC(6,2) NOT NULL CHECK (estimated_hours > 0),
  checklist       JSONB        NOT NULL DEFAULT '[]'::jsonb,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status     ON tasks(status);

-- ============================================================
-- TIME LOGS
-- ended_at = NULL  → timer is currently running
-- is_manual = TRUE → user entered duration directly (no live timer)
-- duration_minutes stored explicitly so queries stay fast and
-- values are stable if related task data changes.
-- ============================================================
CREATE TABLE time_logs (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id          UUID         NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  started_at       TIMESTAMPTZ  NOT NULL,
  ended_at         TIMESTAMPTZ,
  duration_minutes NUMERIC(8,2),
  notes            TEXT,
  is_manual        BOOLEAN      NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),

  CONSTRAINT ended_after_start CHECK (ended_at IS NULL OR ended_at > started_at),
  CONSTRAINT timer_state_consistency CHECK (
    (ended_at IS NULL AND duration_minutes IS NULL) OR
    (ended_at IS NOT NULL AND duration_minutes IS NOT NULL)
  )
);

CREATE INDEX idx_time_logs_task_id    ON time_logs(task_id);
CREATE INDEX idx_time_logs_started_at ON time_logs(started_at);

-- ============================================================
-- HELPER VIEW: actual hours per task
-- Excludes running timers (ended_at IS NOT NULL).
-- is_overrun drives red-warning UI on task cards.
-- ============================================================
CREATE VIEW task_actuals AS
SELECT
  t.id                                              AS task_id,
  t.project_id,
  t.name,
  t.status,
  t.estimated_hours,
  COALESCE(SUM(tl.duration_minutes) / 60.0, 0)     AS actual_hours,
  COALESCE(SUM(tl.duration_minutes) / 60.0, 0)
    > t.estimated_hours                             AS is_overrun
FROM tasks t
LEFT JOIN time_logs tl
  ON tl.task_id = t.id AND tl.ended_at IS NOT NULL
GROUP BY t.id;

-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- Single-user app: any authenticated session gets full access.
-- Only one account will ever exist, so this is equivalent to
-- per-user scoping without hardcoding a UUID.
-- ============================================================
ALTER TABLE projects  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated full access" ON projects
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated full access" ON tasks
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated full access" ON time_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
