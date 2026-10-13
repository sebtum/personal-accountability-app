import { unstable_cache } from "next/cache";
import { cache } from "react";
import { createCacheClient, getAuthToken } from "@/lib/supabase/server-cache";
import { CHART_COLORS } from "@/lib/data/dashboard";
import {
  type CivilDate,
  addCivilDays,
  civilDateKey,
  getZonedParts,
  nextZonedHourBoundaryUtc,
  zonedPartsToUtc,
} from "@/lib/timezone";

export type DaySession = {
  id: string;
  start: string; // "HH:MM" (Europe/Berlin)
  end: string | null; // null → timer still running
  taskName: string;
  projectName: string;
  minutes: number; // minutes inside this day only
};

export type DayDistributionData = {
  dateKey: string;
  /** 24 bars, `hour` label plus one hours-value per project name. */
  bars: Record<string, string | number>[];
  projects: { name: string; color: string }[];
  sessions: DaySession[];
  totalMinutes: number;
  hasRunningTimer: boolean;
};

/** Parses "YYYY-MM-DD"; returns null for anything that is not a real calendar date. */
export function parseDayKey(value: string | undefined): CivilDate | null {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const civil = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  const check = new Date(Date.UTC(civil.year, civil.month - 1, civil.day));
  if (
    check.getUTCFullYear() !== civil.year ||
    check.getUTCMonth() + 1 !== civil.month ||
    check.getUTCDate() !== civil.day
  ) {
    return null;
  }
  return civil;
}

function formatClock(instant: Date): string {
  const p = getZonedParts(instant);
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

const _cachedGetDayDistribution = unstable_cache(
  async (token: string, dateKey: string): Promise<DayDistributionData> => {
    const supabase = createCacheClient(token);
    const civil = parseDayKey(dateKey)!;
    const dayStart = zonedPartsToUtc({ ...civil, hour: 0, minute: 0, second: 0 });
    const dayEnd = zonedPartsToUtc({ ...addCivilDays(civil, 1), hour: 0, minute: 0, second: 0 });
    const earliestStart = zonedPartsToUtc({ ...addCivilDays(civil, -1), hour: 0, minute: 0, second: 0 });
    const now = new Date();
    const isToday = dayStart <= now && now < dayEnd;

    // Bounded lower start keeps idx_time_logs_started_at useful while still
    // catching logs that began the evening before and run into this day.
    let query = supabase
      .from("time_logs")
      .select("id, started_at, ended_at, tasks(name, projects(name))")
      .gte("started_at", earliestStart.toISOString())
      .lt("started_at", dayEnd.toISOString())
      .order("started_at", { ascending: true });
    query = isToday
      ? query.or(`ended_at.is.null,ended_at.gt.${dayStart.toISOString()}`)
      : query.gt("ended_at", dayStart.toISOString());

    const { data: rawData, error } = await query;
    if (error) console.error("[day-distribution] query failed:", error);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (rawData ?? []) as any[];
    const hourMinutes = new Map<string, number[]>(); // project → 24 slots
    const sessions: DaySession[] = [];
    let hasRunningTimer = false;

    for (const row of rows) {
      const running = row.ended_at == null;
      if (running && !isToday) continue;
      const start = new Date(row.started_at);
      const end = running ? now : new Date(row.ended_at);
      if (isNaN(end.getTime())) continue;

      const segStart = start > dayStart ? start : dayStart;
      const segEnd = end < dayEnd ? end : dayEnd;
      if (segStart >= segEnd) continue;

      const projectName: string = row.tasks?.projects?.name ?? "Unbekannt";
      if (!hourMinutes.has(projectName)) hourMinutes.set(projectName, new Array<number>(24).fill(0));
      const slots = hourMinutes.get(projectName)!;

      let cur = new Date(segStart);
      while (cur < segEnd) {
        const nextHour = nextZonedHourBoundaryUtc(cur);
        const stop = segEnd < nextHour ? segEnd : nextHour;
        slots[getZonedParts(cur).hour] += (stop.getTime() - cur.getTime()) / 60000;
        cur = nextHour;
      }

      if (running) hasRunningTimer = true;
      sessions.push({
        id: row.id,
        start: formatClock(start),
        end: running ? null : formatClock(end),
        taskName: row.tasks?.name ?? "Unbekannt",
        projectName,
        minutes: (segEnd.getTime() - segStart.getTime()) / 60000,
      });
    }

    const sortedProjects = [...hourMinutes.keys()].sort();
    const bars = Array.from({ length: 24 }, (_, h) => {
      const bar: Record<string, string | number> = { hour: `${h}h` };
      for (const name of sortedProjects) {
        bar[name] = Math.round((hourMinutes.get(name)![h] / 60) * 100) / 100;
      }
      return bar;
    });

    return {
      dateKey,
      bars,
      projects: sortedProjects.map((name, i) => ({ name, color: CHART_COLORS[i % CHART_COLORS.length] })),
      sessions,
      totalMinutes: sessions.reduce((sum, s) => sum + s.minutes, 0),
      hasRunningTimer,
    };
  },
  ["day-distribution"],
  { tags: ["dashboard", "charts"], revalidate: 60 }
);

export const getDayDistribution = cache(async (dateKey: string): Promise<DayDistributionData> => {
  const token = await getAuthToken();
  return _cachedGetDayDistribution(token, dateKey);
});

/** Today's civil date key in the app timezone. */
export function todayDayKey(): string {
  return civilDateKey(getZonedParts(new Date()));
}
