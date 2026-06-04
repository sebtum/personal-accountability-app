-- ============================================================
-- PERFORMANCE INDEXES (Free Tier Optimization)
-- ============================================================

-- Partial index for running timers (ended_at IS NULL).
-- Used by: getOrphanedTimer(), startTimerAction() guard check.
CREATE INDEX idx_time_logs_running
  ON time_logs(task_id)
  WHERE ended_at IS NULL;

-- Partial index for completed time logs with date range.
-- Used by: getWeeklyHours(), getDailyHours(), getDashboardStats() today-minutes.
CREATE INDEX idx_time_logs_completed_started
  ON time_logs(started_at, task_id)
  WHERE ended_at IS NOT NULL;

-- Index on projects.status.
-- Used by: getDashboardStats() active project count.
CREATE INDEX idx_projects_status ON projects(status);

-- Compound index on tasks(project_id, status).
-- Used by: getDashboardStats() in-progress tasks query.
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);
