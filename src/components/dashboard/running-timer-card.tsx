"use client";

import { useEffect, useState } from "react";
import { useTimerStore } from "@/store/index";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatElapsed } from "@/lib/utils";

/**
 * Driven by the client timer store rather than a query: a reload triggers
 * OrphanedTimerChecker, and every exit from that modal closes the timer, so
 * there is never a running timer on the server for this card to find.
 */
export function RunningTimerCard() {
  const { activeTaskId, timerStartedAt } = useTimerStore();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!activeTaskId || !timerStartedAt) return;
    const update = () => setElapsed(Math.floor((Date.now() - timerStartedAt.getTime()) / 1000));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [activeTaskId, timerStartedAt]);

  const running = Boolean(activeTaskId && timerStartedAt);

  return <StatCard label="Timer läuft" value={running ? formatElapsed(elapsed) : "—"} />;
}
