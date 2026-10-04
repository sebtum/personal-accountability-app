"use client";

import type { TooltipProps } from "recharts";

export function formatHours(value: number) {
  return `${value.toLocaleString("de-DE", { maximumFractionDigits: 2 })} h`;
}

export function sumProjects(
  bar: Record<string, string | number> | undefined,
  projects: { name: string }[],
) {
  if (!bar) return 0;
  const sum = projects.reduce((acc, p) => acc + (Number(bar[p.name]) || 0), 0);
  return Math.round(sum * 100) / 100;
}

export function StackedTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  const rows = payload.filter((entry) => Number(entry.value) > 0);
  const total = Math.round(rows.reduce((acc, e) => acc + Number(e.value), 0) * 100) / 100;

  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-md"
      style={{
        background: "var(--popover)",
        color: "var(--popover-foreground)",
        borderColor: "var(--border)",
      }}
    >
      <div className="mb-1 flex items-baseline justify-between gap-4">
        <span className="font-medium">{String(label)}</span>
        <span className="font-semibold">Gesamt {formatHours(total)}</span>
      </div>
      {rows.map((entry) => (
        <div key={String(entry.dataKey)} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block size-2.5 shrink-0 rounded-full"
              style={{ background: entry.color }}
            />
            {entry.name}
          </span>
          <span className="tabular-nums">{formatHours(Number(entry.value))}</span>
        </div>
      ))}
    </div>
  );
}
