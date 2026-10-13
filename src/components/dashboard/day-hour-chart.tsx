"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { DayDistributionData } from "@/lib/data/day-distribution";
import { StackedTooltip } from "./chart-tooltip";

export function DayHourChart({ data }: { data: DayDistributionData }) {
  if (!data.projects.length) {
    return <p className="text-sm text-muted-foreground">Keine Zeitdaten für diesen Tag.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data.bars} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="hour" tick={{ fontSize: 11 }} interval={1} />
        <YAxis
          tick={{ fontSize: 11 }}
          domain={[0, 1]}
          ticks={[0, 0.25, 0.5, 0.75, 1]}
          tickFormatter={(v: number) => `${Math.round(v * 60)} min`}
        />
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
      </BarChart>
    </ResponsiveContainer>
  );
}
