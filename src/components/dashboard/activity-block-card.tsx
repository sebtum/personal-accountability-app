"use client";

import { useState } from "react";
import type { ActivityBlock } from "@/lib/data/dashboard";
import { LogTime } from "@/components/log-time";
import { formatMinutes } from "@/lib/utils";

export function ActivityBlockCard({ block }: { block: ActivityBlock }) {
  const [open, setOpen] = useState(false);
  const sessionCount = block.sessions.length;
  const expandable = sessionCount > 1;

  const summary = (
    <div className="flex items-center justify-between gap-2 w-full text-left">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{block.task_name}</p>
        <p className="text-xs text-muted-foreground truncate">{block.project_name}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold tabular-nums">{formatMinutes(block.total_minutes)}</p>
        <p className="text-xs text-muted-foreground">
          <LogTime iso={block.started_at} endIso={block.ended_at} />
          {expandable && ` · ${sessionCount} Sessions`}
        </p>
      </div>
      {expandable && (
        <span
          aria-hidden
          className={`text-muted-foreground text-xs transition-transform ${open ? "rotate-90" : ""}`}
        >
          ▶
        </span>
      )}
    </div>
  );

  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      {expandable ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="w-full flex items-center gap-2 cursor-pointer"
        >
          {summary}
        </button>
      ) : (
        summary
      )}

      {expandable && open && (
        <ul className="mt-3 pt-3 border-t space-y-2">
          {block.sessions.map((session) => (
            <li key={session.id} className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  <LogTime iso={session.started_at} endIso={session.ended_at} />
                  {session.is_manual && " · manuell"}
                </p>
                {session.notes && (
                  <p className="text-xs text-muted-foreground/80 mt-0.5 break-words">
                    {session.notes}
                  </p>
                )}
              </div>
              <span className="text-xs tabular-nums shrink-0">
                {formatMinutes(session.duration_minutes)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
