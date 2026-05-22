"use server";

import { getDailyHours, getHourlyDistribution } from "@/lib/data/dashboard";
import type { DailyChartData, HourlyChartData } from "@/lib/data/dashboard";

export async function getDailyHoursAction(weekOffset: number): Promise<DailyChartData> {
  const clamped = Number.isFinite(weekOffset)
    ? Math.max(-104, Math.min(0, Math.trunc(weekOffset)))
    : 0;
  return getDailyHours(clamped);
}

const VALID_WINDOWS = [7, 14, 30, 90];

export async function getHourlyDistributionAction(windowDays: number): Promise<HourlyChartData> {
  const days = VALID_WINDOWS.includes(windowDays) ? windowDays : 7;
  return getHourlyDistribution(days);
}
