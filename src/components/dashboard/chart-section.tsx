"use client";

import { useState } from "react";
import { WeeklyChart } from "./weekly-chart";
import { DailyChart } from "./daily-chart";
import type { WeeklyChartData, DailyChartData } from "@/lib/data/dashboard";

type View = "week" | "day";

export function ChartSection({
  weeklyData,
  dailyData,
}: {
  weeklyData: WeeklyChartData;
  dailyData: DailyChartData;
}) {
  const [view, setView] = useState<View>("week");

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-medium">
          {view === "week" ? "Stunden pro Woche" : "Diese Woche – Tagesansicht"}
        </h2>
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
      <div className="rounded-lg border bg-card p-4">
        {view === "week" ? (
          <WeeklyChart data={weeklyData} />
        ) : (
          <DailyChart data={dailyData} />
        )}
      </div>
    </section>
  );
}
