"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { DailyChartData } from "@/lib/data/dashboard";
import { StackedTooltip, formatHours, sumProjects } from "./chart-tooltip";

export function DailyChart({ data }: { data: DailyChartData }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!data.projects.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Keine Zeitdaten für diese Woche.
      </p>
    );
  }

  const hoverTotal =
    activeIndex != null ? sumProjects(data.bars[activeIndex], data.projects) : 0;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data.bars}
        margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
        onMouseMove={(state) => setActiveIndex(state?.activeTooltipIndex ?? null)}
        onMouseLeave={() => setActiveIndex(null)}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} unit="h" />
        <Tooltip content={<StackedTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        {data.projects.map((project, i) => (
          <Bar
            key={project.name}
            dataKey={project.name}
            stackId="a"
            fill={project.color}
            radius={i === data.projects.length - 1 ? [3, 3, 0, 0] : undefined}
          />
        ))}
        {hoverTotal > 0 && (
          <ReferenceLine
            y={hoverTotal}
            stroke="var(--foreground)"
            strokeOpacity={0.6}
            strokeDasharray="4 4"
            label={{
              value: `Σ ${formatHours(hoverTotal)}`,
              position: "insideTopRight",
              fontSize: 11,
              fill: "var(--foreground)",
            }}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
