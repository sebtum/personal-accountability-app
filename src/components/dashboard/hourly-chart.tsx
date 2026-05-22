"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { HourlyChartData } from "@/lib/data/dashboard";

export function HourlyChart({ data }: { data: HourlyChartData }) {
  const hasData = data.bars.some((b) => b.minPerDay > 0);

  if (!hasData) {
    return (
      <p className="text-sm text-muted-foreground">
        Noch keine Zeitdaten für diesen Zeitraum.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data.bars} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="hour" tick={{ fontSize: 11 }} interval={1} />
        <YAxis tick={{ fontSize: 11 }} unit=" min" />
        <Tooltip
          formatter={(value: number) => [`${value} min/Tag`, "Ø"]}
          labelFormatter={(label) => String(label)}
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--background))",
          }}
        />
        <Bar dataKey="minPerDay" fill="#6366f1" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
