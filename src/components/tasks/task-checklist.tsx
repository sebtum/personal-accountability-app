"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { toggleChecklistItem } from "@/lib/actions/tasks";
import type { ChecklistItem } from "@/types/database";

type Props = {
  taskId: string;
  projectId: string;
  checklist: ChecklistItem[];
};

export function TaskChecklist({ taskId, projectId, checklist }: Props) {
  const [open, setOpen] = useState(false);
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState<Set<string>>(new Set());

  if (!checklist.length) return null;

  const items = checklist.map((item) => ({
    ...item,
    completed: item.id in optimistic ? optimistic[item.id] : item.completed,
  }));

  const done = items.filter((i) => i.completed).length;

  async function handleToggle(itemId: string, completed: boolean) {
    setOptimistic((prev) => ({ ...prev, [itemId]: completed }));
    setPending((prev) => new Set(prev).add(itemId));

    const result = await toggleChecklistItem(taskId, itemId, completed, projectId);

    setPending((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });

    if (result?.error) {
      // revert optimistic update on failure
      setOptimistic((prev) => ({ ...prev, [itemId]: !completed }));
    }
  }

  return (
    <div className="mt-1.5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        {done}/{checklist.length} Checkliste
      </button>

      {open && (
        <ul className="mt-2 space-y-1.5 ml-1">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-2">
              <input
                type="checkbox"
                id={`cl-${item.id}`}
                checked={item.completed}
                onChange={(e) => handleToggle(item.id, e.target.checked)}
                disabled={pending.has(item.id)}
                className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer accent-primary"
              />
              <label
                htmlFor={`cl-${item.id}`}
                className={`text-xs cursor-pointer select-none leading-snug ${
                  item.completed ? "line-through text-muted-foreground" : ""
                }`}
              >
                {item.text}
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
