"use client";

import { useTransition } from "react";
import { updateProjectStatus } from "@/lib/actions/projects";
import type { ProjectStatus } from "@/types/database";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Aktiv",
  completed: "Abgeschlossen",
  archived: "Archiviert",
};

const STATUS_CLASSES: Record<ProjectStatus, string> = {
  active: "bg-primary/10 text-primary",
  completed: "bg-muted text-muted-foreground",
  archived: "bg-muted text-muted-foreground",
};

export function ProjectStatusSelect({
  id,
  status,
}: {
  id: string;
  status: ProjectStatus;
}) {
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as ProjectStatus;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("id", id);
      fd.append("status", newStatus);
      await updateProjectStatus(fd);
    });
  }

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={isPending}
      className={`text-xs px-2 py-0.5 rounded-full font-medium border-0 cursor-pointer outline-none transition-opacity ${STATUS_CLASSES[status]} ${isPending ? "opacity-50" : ""}`}
    >
      {(Object.keys(STATUS_LABELS) as ProjectStatus[]).map((s) => (
        <option key={s} value={s}>
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
