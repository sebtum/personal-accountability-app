import { createClient } from "@/lib/supabase/server";

export type InProgressTask = {
  id: string;
  name: string;
  project_id: string;
  project_name: string;
  estimated_hours: number;
};

export type RecentLog = {
  id: string;
  task_name: string;
  project_name: string;
  started_at: string;
  duration_minutes: number;
  is_manual: boolean;
};

export type DashboardStats = {
  activeProjects: number;
  openTasks: number;
  todayMinutes: number;
  inProgressTasks: InProgressTask[];
  recentLogs: RecentLog[];
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [projectsRes, openTasksRes, todayLogsRes, inProgressRes, recentLogsRes] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id", { count: "exact" })
        .eq("status", "active"),
      supabase
        .from("tasks")
        .select("id", { count: "exact" })
        .in("status", ["todo", "in_progress"]),
      supabase
        .from("time_logs")
        .select("duration_minutes")
        .gte("started_at", todayStart.toISOString())
        .not("ended_at", "is", null),
      supabase
        .from("tasks")
        .select("id, name, project_id, estimated_hours, projects(name)")
        .eq("status", "in_progress"),
      supabase
        .from("time_logs")
        .select("id, started_at, duration_minutes, is_manual, tasks(name, project_id, projects(name))")
        .not("ended_at", "is", null)
        .order("started_at", { ascending: false })
        .limit(5),
    ]);

  const todayMinutes = (todayLogsRes.data ?? []).reduce(
    (sum, l) => sum + (l.duration_minutes ?? 0),
    0
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inProgressTasks: InProgressTask[] = (inProgressRes.data ?? []).map((t: any) => ({
    id: t.id,
    name: t.name,
    project_id: t.project_id,
    project_name: t.projects?.name ?? "–",
    estimated_hours: t.estimated_hours,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentLogs: RecentLog[] = (recentLogsRes.data ?? []).map((l: any) => ({
    id: l.id,
    task_name: l.tasks?.name ?? "–",
    project_name: l.tasks?.projects?.name ?? "–",
    started_at: l.started_at,
    duration_minutes: l.duration_minutes ?? 0,
    is_manual: l.is_manual,
  }));

  return {
    activeProjects: projectsRes.count ?? 0,
    openTasks: openTasksRes.count ?? 0,
    todayMinutes,
    inProgressTasks,
    recentLogs,
  };
}
