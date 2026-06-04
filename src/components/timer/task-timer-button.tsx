"use client";

import { useEffect, useState, useTransition } from "react";
import { useTimerStore } from "@/store/index";
import { startTimerAction, stopTimerAction } from "@/lib/actions/time-logs";
import { Button } from "@/components/ui/button";

function formatElapsed(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0
    ? `${pad(h)}:${pad(m)}:${pad(s)}`
    : `${pad(m)}:${pad(s)}`;
}

type Props = {
  taskId: string;
  projectId: string;
};

export function TaskTimerButton({ taskId, projectId }: Props) {
  const { activeTaskId, activeLogId, timerStartedAt, startTimer, stopTimer } =
    useTimerStore();

  const isActive = activeTaskId === taskId;
  const [elapsed, setElapsed] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isActive || !timerStartedAt) return;
    const update = () => {
      setElapsed(
        Math.floor((Date.now() - timerStartedAt.getTime()) / 1000)
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [isActive, timerStartedAt]);

  function handleStart() {
    if (activeTaskId && activeTaskId !== taskId) return;
    setError(null);
    startTransition(async () => {
      const result = await startTimerAction(taskId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      startTimer(taskId, result.logId);
    });
  }

  function handleStop() {
    if (!activeLogId) return;
    setError(null);
    const logId = activeLogId;
    startTransition(async () => {
      const result = await stopTimerAction(
        logId,
        projectId,
        new Date().toISOString(),
        taskId
      );
      if (result?.error) {
        setError(result.error);
        return;
      }
      stopTimer();
    });
  }

  const otherActive = activeTaskId !== null && activeTaskId !== taskId;

  return (
    <div className="flex items-center gap-2">
      {isActive && (
        <span className="text-xs font-mono text-primary tabular-nums">
          {formatElapsed(elapsed)}
        </span>
      )}
      {isActive ? (
        <Button
          size="sm"
          variant="destructive"
          onClick={handleStop}
          disabled={isPending}
          className="text-xs px-2 py-1 h-7"
        >
          Stop
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={handleStart}
          disabled={isPending || otherActive}
          title={otherActive ? "Anderer Timer läuft bereits" : undefined}
          className="text-xs px-2 py-1 h-7"
        >
          Start
        </Button>
      )}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
