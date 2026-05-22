"use client";

import { useState, useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WeeklyChart } from "./weekly-chart";
import { DailyChart } from "./daily-chart";
import type { WeeklyChartData, DailyChartData } from "@/lib/data/dashboard";
import { getDailyHoursAction } from "@/lib/actions/chart";

type View = "week" | "day";

export function ChartSection({
  weeklyData,
  dailyData: initialDailyData,
}: {
  weeklyData: WeeklyChartData;
  dailyData: DailyChartData;
}) {
  const [view, setView] = useState<View>("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [dailyData, setDailyData] = useState(initialDailyData);
  const [isPending, startTransition] = useTransition();

  function navigate(newOffset: number) {
    startTransition(async () => {
      const data = await getDailyHoursAction(newOffset);
      setWeekOffset(newOffset);
      setDailyData(data);
    });
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-medium">
          {view === "week" ? "Stunden pro Woche" : dailyData.weekLabel}
        </h2>
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
          </div>
        </div>
      </div>
      <div className={`rounded-lg border bg-card p-4 transition-opacity ${isPending ? "opacity-50" : ""}`}>
        {view === "week" ? (
          <WeeklyChart data={weeklyData} />
        ) : (
          <DailyChart data={dailyData} />
        )}
      </div>
    </section>
  );
}
