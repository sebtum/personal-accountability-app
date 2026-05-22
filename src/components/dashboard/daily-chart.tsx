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
import type { DailyChartData } from "@/lib/data/dashboard";

export function DailyChart({ data }: { data: DailyChartData }) {
  if (!data.projects.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Keine Zeitdaten für diese Woche.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data.bars} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} unit="h" />
        <Tooltip
          formatter={(value: number, name: string) => [`${value} h`, name]}
          labelFormatter={(label) => String(label)}
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--background))",
          }}
        />
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
