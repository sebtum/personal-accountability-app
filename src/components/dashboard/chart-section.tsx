"use client";

import { useState, useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WeeklyChart } from "./weekly-chart";
import { DailyChart } from "./daily-chart";
import { HourlyChart } from "./hourly-chart";
import type { WeeklyChartData, DailyChartData, HourlyChartData } from "@/lib/data/dashboard";
import { getDailyHoursAction, getHourlyDistributionAction } from "@/lib/actions/chart";

type View = "week" | "day" | "hour";

const WINDOW_OPTIONS = [
  { label: "1W", days: 7 },
  { label: "2W", days: 14 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
] as const;

const WINDOW_LABELS: Record<number, string> = {
  7: "Woche",
  14: "2 Wochen",
  30: "Monat",
  90: "3 Monate",
};

export function ChartSection({
  weeklyData,
  dailyData: initialDailyData,
  hourlyData: initialHourlyData,
}: {
  weeklyData: WeeklyChartData;
  dailyData: DailyChartData;
  hourlyData: HourlyChartData;
}) {
  const [view, setView] = useState<View>("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [dailyData, setDailyData] = useState(initialDailyData);
  const [hourlyData, setHourlyData] = useState(initialHourlyData);
  const [hourlyWindowDays, setHourlyWindowDays] = useState(7);
  const [isPending, startTransition] = useTransition();

  function navigate(newOffset: number) {
    startTransition(async () => {
      const data = await getDailyHoursAction(newOffset);
      setWeekOffset(newOffset);
      setDailyData(data);
    });
  }

  function changeWindow(days: number) {
    startTransition(async () => {
      const data = await getHourlyDistributionAction(days);
      setHourlyWindowDays(days);
      setHourlyData(data);
    });
  }

  const title =
    view === "week"
      ? "Stunden pro Woche"
      : view === "day"
      ? dailyData.weekLabel
      : `Produktivität nach Uhrzeit · Ø letzte ${WINDOW_LABELS[hourlyWindowDays]}`;

  return (
    <section>
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <h2 className="font-medium">{title}</h2>
        <div className="flex items-center gap-2">
          {view === "day" && (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => navigate(weekOffset - 1)}
                disabled={isPending}
                className="p-1 rounded hover:bg-muted disabled:opacity-40 transition-colors"
                aria-label="Vorherige Woche"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate(weekOffset + 1)}
                disabled={isPending || weekOffset >= 0}
                className="p-1 rounded hover:bg-muted disabled:opacity-40 transition-colors"
                aria-label="Nächste Woche"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
          {view === "hour" && (
            <div className="flex gap-0.5 rounded-md border p-0.5 text-sm">
              {WINDOW_OPTIONS.map(({ label, days }) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => changeWindow(days)}
                  disabled={isPending}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    hourlyWindowDays === days
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-0.5 rounded-md border p-0.5 text-sm">
            <button
              type="button"
              onClick={() => setView("week")}
              className={`px-3 py-1 rounded transition-colors ${
                view === "week"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Pro Woche
            </button>
            <button
              type="button"
              onClick={() => setView("day")}
              className={`px-3 py-1 rounded transition-colors ${
                view === "day"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Pro Tag
            </button>
            <button
              type="button"
              onClick={() => setView("hour")}
              className={`px-3 py-1 rounded transition-colors ${
                view === "hour"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Pro Stunde
            </button>
          </div>
        </div>
      </div>
      <div
        className={`rounded-lg border bg-card p-4 transition-opacity ${isPending ? "opacity-50" : ""}`}
      >
        {view === "week" && <WeeklyChart data={weeklyData} />}
        {view === "day" && <DailyChart data={dailyData} />}
        {view === "hour" && <HourlyChart data={hourlyData} />}
      </div>
    </section>
  );
}
