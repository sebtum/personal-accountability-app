"use server";

import { getDailyHours } from "@/lib/data/dashboard";
import type { DailyChartData } from "@/lib/data/dashboard";

export async function getDailyHoursAction(weekOffset: number): Promise<DailyChartData> {
  const clamped = Number.isFinite(weekOffset)
    ? Math.max(-104, Math.min(0, Math.trunc(weekOffset)))
    : 0;
  return getDailyHours(clamped);
}
