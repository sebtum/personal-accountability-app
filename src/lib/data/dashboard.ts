import { unstable_cache } from "next/cache";
import { cache } from "react";
import { createCacheClient, getAuthToken } from "@/lib/supabase/server-cache";
import {
  type CivilDate,
  addCivilDays,
  civilDateKey,
  formatCivilShortDate,
  getZonedParts,
  isoWeekNumber,
  nextZonedHourBoundaryUtc,
  startOfZonedDay,
  startOfZonedWeek,
  zonedPartsToUtc,
} from "@/lib/timezone";

const CHART_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444",
  "#3b82f6", "#8b5cf6", "#14b8a6", "#f97316",
];

function getWeekLabel(civil: CivilDate): string {
  return `KW ${isoWeekNumber(civil)}`;
}

export type WeeklyChartData = {
  bars: Record<string, string | number>[];
  projects: { name: string; color: string }[];
};

export type DailyChartData = {
  bars: Record<string, string | number>[];
  projects: { name: string; color: string }[];
  weekLabel: string;
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

export type HourlyChartData = {
  bars: { hour: string; minPerDay: number }[];
  windowDays: number;
};

export type DashboardStats = {
  activeProjects: number;
  openTasks: number;
  todayMinutes: number;
  inProgressTasks: InProgressTask[];
  recentLogs: RecentLog[];
};

// ─── Module-level cache references (stable function identity) ────────────────

const _cachedGetWeeklyHours = unstable_cache(
  async (token: string): Promise<WeeklyChartData> => {
    const supabase = createCacheClient(token);
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
      const mondayCivil = getZonedParts(startOfZonedWeek(new Date(row.started_at)));
      const weekKey = civilDateKey(mondayCivil);
      projectNames.add(projectName);
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, { label: getWeekLabel(mondayCivil), hours: new Map() });
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

    return {
      bars,
      projects: sortedProjects.map((name, i) => ({ name, color: CHART_COLORS[i % CHART_COLORS.length] })),
    };
  },
  ["weekly-hours"],
  { tags: ["dashboard", "charts"], revalidate: 300 }
);

const _cachedGetDailyHours = unstable_cache(
  async (token: string, weekOffset: number): Promise<DailyChartData> => {
    const supabase = createCacheClient(token);
    const todayCivil = getZonedParts(new Date());
    const targetCivil = addCivilDays(todayCivil, weekOffset * 7);
    // Noon avoids any theoretical edge case around a DST boundary while resolving the right calendar week.
    const monday = startOfZonedWeek(zonedPartsToUtc({ ...targetCivil, hour: 12, minute: 0, second: 0 }));
    const mondayCivil = getZonedParts(monday);
    const nextMondayCivil = addCivilDays(mondayCivil, 7);
    const nextMonday = zonedPartsToUtc({ ...nextMondayCivil, hour: 0, minute: 0, second: 0 });
    const sundayCivil = addCivilDays(mondayCivil, 6);
    const weekLabel = `${getWeekLabel(mondayCivil)}, ${formatCivilShortDate(mondayCivil)}–${formatCivilShortDate(sundayCivil)}${sundayCivil.year}`;

    const { data: rawData, error } = await supabase
      .from("time_logs")
      .select("started_at, duration_minutes, tasks(project_id, projects(name))")
      .not("ended_at", "is", null)
      .not("duration_minutes", "is", null)
      .gte("started_at", monday.toISOString())
      .lt("started_at", nextMonday.toISOString());

    if (error) return { bars: [], projects: [], weekLabel };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = rawData as any[] | null;
    const DAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
    const dayMap = new Map<number, Map<string, number>>();
    const projectNames = new Set<string>();

    for (const row of data ?? []) {
      const projectName: string = row.tasks?.projects?.name ?? "Unbekannt";
      const dayOfWeek = getZonedParts(new Date(row.started_at)).weekdayMon0;
      projectNames.add(projectName);
      if (!dayMap.has(dayOfWeek)) dayMap.set(dayOfWeek, new Map());
      const entry = dayMap.get(dayOfWeek)!;
      entry.set(projectName, (entry.get(projectName) ?? 0) + (row.duration_minutes ?? 0));
    }

    const sortedProjects = [...projectNames].sort();
    const bars = Array.from({ length: 7 }, (_, i) => {
      const dayCivil = addCivilDays(mondayCivil, i);
      const bar: Record<string, string | number> = { day: `${DAY_LABELS[i]} ${formatCivilShortDate(dayCivil)}` };
      const dayEntry = dayMap.get(i);
      for (const name of sortedProjects) {
        bar[name] = Math.round(((dayEntry?.get(name) ?? 0) / 60) * 10) / 10;
      }
      return bar;
    });

    return {
      bars,
      projects: sortedProjects.map((name, i) => ({ name, color: CHART_COLORS[i % CHART_COLORS.length] })),
      weekLabel,
    };
  },
  ["daily-hours"],
  { tags: ["dashboard", "charts"], revalidate: 120 }
);

const _cachedGetHourlyDistribution = unstable_cache(
  async (token: string, windowDays: number): Promise<HourlyChartData> => {
    const supabase = createCacheClient(token);
    const todayStart = startOfZonedDay(new Date());
    const sinceCivil = addCivilDays(getZonedParts(todayStart), -windowDays);
    const since = zonedPartsToUtc({ ...sinceCivil, hour: 0, minute: 0, second: 0 });

    const { data: rawData, error } = await supabase
      .from("time_logs")
      .select("started_at, ended_at")
      .not("ended_at", "is", null)
      .gte("started_at", since.toISOString());

    const hourTotals = new Array<number>(24).fill(0);
    if (!error && rawData) {
      for (const row of rawData) {
        const start = new Date(row.started_at);
        const end = new Date(row.ended_at as string);
        if (isNaN(end.getTime())) continue;
        let cur = new Date(start);
        while (cur < end) {
          const nextHour = nextZonedHourBoundaryUtc(cur);
          const segEnd = end < nextHour ? end : nextHour;
          hourTotals[getZonedParts(cur).hour] += (segEnd.getTime() - cur.getTime()) / 60000;
          cur = nextHour;
        }
      }
    }

    return {
      bars: Array.from({ length: 24 }, (_, h) => ({
        hour: `${h}h`,
        minPerDay: Math.round((hourTotals[h] / windowDays) * 10) / 10,
      })),
      windowDays,
    };
  },
  ["hourly-dist"],
  { tags: ["dashboard", "charts"], revalidate: 300 }
);

const _cachedGetDashboardStats = unstable_cache(
  async (token: string): Promise<DashboardStats> => {
    const supabase = createCacheClient(token);
    const todayStart = startOfZonedDay(new Date());

    const [projectsRes, openTasksRes, todayLogsRes, inProgressRes, recentLogsRes] =
      await Promise.all([
        supabase.from("projects").select("id", { count: "exact" }).eq("status", "active"),
        supabase.from("tasks").select("id", { count: "exact" }).in("status", ["todo", "in_progress"]),
        supabase.from("time_logs").select("duration_minutes").gte("started_at", todayStart.toISOString()).not("ended_at", "is", null),
        supabase.from("tasks").select("id, name, project_id, estimated_hours, projects(name)").eq("status", "in_progress"),
        supabase.from("time_logs").select("id, started_at, duration_minutes, is_manual, tasks(name, project_id, projects(name))").not("ended_at", "is", null).order("started_at", { ascending: false }).limit(5),
      ]);

    const todayMinutes = (todayLogsRes.data ?? []).reduce((sum, l) => sum + (l.duration_minutes ?? 0), 0);

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
  },
  ["dashboard-stats"],
  { tags: ["dashboard"], revalidate: 60 }
);

// ─── Public API — reads cookies once, outside the cache ──────────────────────

export const getWeeklyHours = cache(async (): Promise<WeeklyChartData> => {
  const token = await getAuthToken();
  return _cachedGetWeeklyHours(token);
});

export const getDailyHours = cache(async (weekOffset: number = 0): Promise<DailyChartData> => {
  const token = await getAuthToken();
  return _cachedGetDailyHours(token, weekOffset);
});

export const getHourlyDistribution = cache(async (windowDays: number = 7): Promise<HourlyChartData> => {
  const token = await getAuthToken();
  return _cachedGetHourlyDistribution(token, windowDays);
});

export const getDashboardStats = cache(async (): Promise<DashboardStats> => {
  const token = await getAuthToken();
  return _cachedGetDashboardStats(token);
});
