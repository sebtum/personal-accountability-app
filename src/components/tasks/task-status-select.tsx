"use client";

import { useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { updateTaskStatus } from "@/lib/actions/tasks";
import type { TaskStatus } from "@/types/database";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Offen",
  in_progress: "In Bearbeitung",
  done: "Erledigt",
};

const STATUS_CLASSES: Record<TaskStatus, string> = {
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/10 text-primary",
  done: "bg-muted text-muted-foreground",
};

export function TaskStatusSelect({
  taskId,
  projectId,
  currentStatus,
}: {
  taskId: string;
  projectId: string;
  currentStatus: TaskStatus;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();

  function handleChange(newStatus: TaskStatus) {
    const prev = status;
    setStatus(newStatus);
    startTransition(async () => {
      const result = await updateTaskStatus(taskId, newStatus, projectId);
      if (result?.error) setStatus(prev);
    });
  }

  return (
    <div
      className={cn(
        "relative inline-flex items-center shrink-0 rounded-full",
        STATUS_CLASSES[status],
        isPending && "opacity-50"
      )}
    >
      <select
        value={status}
        onChange={(e) => handleChange(e.target.value as TaskStatus)}
        disabled={isPending}
        className="appearance-none bg-transparent text-xs pl-2 pr-5 py-0.5 font-medium cursor-pointer focus:outline-none"
        aria-label="Status ändern"
      >
        {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-1.5 h-3 w-3 pointer-events-none" />
    </div>
  );
}
