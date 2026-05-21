"use client";

import { useEffect, useState, useTransition } from "react";
import {
  resolveOrphanedTimerAction,
  discardOrphanedTimerAction,
} from "@/lib/actions/time-logs";
import { Button } from "@/components/ui/button";
import { useTimerStore } from "@/store/index";
import type { OrphanedTimer } from "@/lib/data/time-logs";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function OrphanedTimerModal({ timer }: { timer: OrphanedTimer }) {
  const { startTimer, stopTimer } = useTimerStore();
  const [customEnd, setCustomEnd] = useState(
    toLocalInputValue(new Date())
  );
  const [error, setError] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Sync Zustand with the orphaned timer so the correct task shows "Stop"
  useEffect(() => {
    startTimer(timer.task_id, timer.id, new Date(timer.started_at));
  }, [timer.task_id, timer.id, timer.started_at, startTimer]);

  if (resolved) return null;

  function handleResolve(endedAt: string) {
    setError(null);
    startTransition(async () => {
      const result = await resolveOrphanedTimerAction(timer.id, endedAt);
      if (result?.error) {
        setError(result.error);
      } else {
        stopTimer();
        setResolved(true);
      }
    });
  }

  function handleDiscard() {
    setError(null);
    startTransition(async () => {
      const result = await discardOrphanedTimerAction(timer.id);
      if (result?.error) {
        setError(result.error);
      } else {
        stopTimer();
        setResolved(true);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-xl border shadow-lg p-6 max-w-md w-full mx-4">
        <h2 className="font-semibold text-lg mb-2">Offener Timer gefunden</h2>
        <p className="text-sm text-muted-foreground mb-1">
          Du hattest einen offenen Timer für{" "}
          <span className="font-medium text-foreground">{timer.task_name}</span>{" "}
          seit{" "}
          <span className="font-medium text-foreground">
            {formatDateTime(timer.started_at)}
          </span>
          .
        </p>
        <p className="text-sm text-muted-foreground mb-5">
          Bis wann hast du gearbeitet?
        </p>

        <div className="space-y-3">
          <Button
            className="w-full"
            onClick={() => handleResolve(new Date().toISOString())}
            disabled={isPending}
          >
            Jetzt beenden ({formatDateTime(new Date().toISOString())})
          </Button>

          <div className="flex gap-2">
            <input
              type="datetime-local"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
            />
            <Button
              variant="outline"
              onClick={() => handleResolve(new Date(customEnd).toISOString())}
              disabled={isPending || !customEnd}
            >
              Andere Zeit
            </Button>
          </div>

          <Button
            variant="ghost"
            className="w-full text-destructive hover:text-destructive"
            onClick={handleDiscard}
            disabled={isPending}
          >
            Verwerfen (nicht speichern)
          </Button>
        </div>

        {error && (
          <p className="mt-3 text-sm text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
}
