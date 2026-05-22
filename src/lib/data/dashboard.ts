import { createClient } from "@/lib/supabase/server";

const CHART_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444",
  "#3b82f6", "#8b5cf6", "#14b8a6", "#f97316",
];

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekLabel(monday: Date): string {
  const d = new Date(monday);
  d.setDate(d.getDate() + 3);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `KW ${weekNum}`;
}

export type WeeklyChartData = {
  bars: Record<string, string | number>[];
  projects: { name: string; color: string }[];
};

export type DailyChartData = {
  bars: Record<string, string | number>[];
  projects: { name: string; color: string }[];
};

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

export async function getWeeklyHours(): Promise<WeeklyChartData> {
  const supabase = await createClient();

  const since = new Date();
  since.setDate(since.getDate() - 56);

  const { data: rawData } = await supabase
    .from("time_logs")
    .select("started_at, duration_minutes, tasks(project_id, projects(name))")
    .not("ended_at", "is", null)
    .not("duration_minutes", "is", null)
    .gte("started_at", since.toISOString());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = rawData as any[] | null;
  if (!data?.length) return { bars: [], projects: [] };

  type WeekEntry = { label: string; hours: Map<string, number> };
  const weekMap = new Map<string, WeekEntry>();
  const projectNames = new Set<string>();

  for (const row of data) {
    const projectName: string = row.tasks?.projects?.name ?? "Unbekannt";
    const monday = getMonday(new Date(row.started_at));
    const weekKey = monday.toISOString().slice(0, 10);

    projectNames.add(projectName);

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, { label: getWeekLabel(monday), hours: new Map() });
    }
    const entry = weekMap.get(weekKey)!;
    entry.hours.set(projectName, (entry.hours.get(projectName) ?? 0) + (row.duration_minutes ?? 0));
  }

  const sortedProjects = [...projectNames].sort();
  const bars = [...weekMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, entry]) => {
      const bar: Record<string, string | number> = { week: entry.label };
      for (const name of sortedProjects) {
        bar[name] = Math.round(((entry.hours.get(name) ?? 0) / 60) * 10) / 10;
      }
      return bar;
    });

  const projects = sortedProjects.map((name, i) => ({
    name,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return { bars, projects };
}

export async function getDailyHours(): Promise<DailyChartData> {
  const supabase = await createClient();

  const monday = getMonday(new Date());
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);

  const { data: rawData, error } = await supabase
    .from("time_logs")
    .select("started_at, duration_minutes, tasks(project_id, projects(name))")
    .not("ended_at", "is", null)
    .not("duration_minutes", "is", null)
    .gte("started_at", monday.toISOString())
    .lt("started_at", nextMonday.toISOString());

  if (error) return { bars: [], projects: [] };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = rawData as any[] | null;

  const DAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const dayMap = new Map<number, Map<string, number>>();
  const projectNames = new Set<string>();

  for (const row of data ?? []) {
    const projectName: string = row.tasks?.projects?.name ?? "Unbekannt";
    const d = new Date(row.started_at);
    const dayOfWeek = (d.getDay() + 6) % 7; // 0=Mo … 6=So

    projectNames.add(projectName);
    if (!dayMap.has(dayOfWeek)) dayMap.set(dayOfWeek, new Map());
    const entry = dayMap.get(dayOfWeek)!;
    entry.set(projectName, (entry.get(projectName) ?? 0) + (row.duration_minutes ?? 0));
  }

  const sortedProjects = [...projectNames].sort();

  const bars = Array.from({ length: 7 }, (_, i) => {
    const dateForDay = new Date(monday);
    dateForDay.setDate(monday.getDate() + i);
    const dd = String(dateForDay.getDate()).padStart(2, "0");
    const mm = String(dateForDay.getMonth() + 1).padStart(2, "0");
    const label = `${DAY_LABELS[i]} ${dd}.${mm}.`;

    const bar: Record<string, string | number> = { day: label };
    const dayEntry = dayMap.get(i);
    for (const name of sortedProjects) {
      bar[name] = Math.round(((dayEntry?.get(name) ?? 0) / 60) * 10) / 10;
    }
    return bar;
  });

  const projects = sortedProjects.map((name, i) => ({
    name,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return { bars, projects };
}

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
