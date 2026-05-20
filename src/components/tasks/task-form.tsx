"use client";

import { useState, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import type { Database, ChecklistItem } from "@/types/database";
import type { TaskActionState } from "@/lib/actions/tasks";

type Task = Database["public"]["Tables"]["tasks"]["Row"];

interface TaskFormProps {
  action: (
    prevState: TaskActionState,
    formData: FormData
  ) => Promise<TaskActionState>;
  task?: Task;
  projectId: string;
}

export function TaskForm({ action, task, projectId }: TaskFormProps) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    task?.checklist ?? []
  );
  const [state, formAction, pending] = useActionState(action, null);

  const addItem = () => {
    setChecklist((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: "", completed: false },
    ]);
  };

  const removeItem = (id: string) => {
    setChecklist((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItemText = (id: string, text: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, text } : item))
    );
  };

  // Filter empty items before serializing — avoids persisting blank rows
  const serializedChecklist = JSON.stringify(
    checklist.filter((item) => item.text.trim() !== "")
  );

  return (
    <form action={formAction} className="space-y-5 max-w-lg">
      {/* Hidden fields for server context */}
      <input type="hidden" name="project_id" value={projectId} />
      {task && <input type="hidden" name="id" value={task.id} />}
      {/* Checklist serialized as JSON — see ADR-011 */}
      <input type="hidden" name="checklist" value={serializedChecklist} />

      {state?.error && (
        <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
          {state.error}
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={task?.name}
          placeholder="z.B. API-Endpunkte implementieren"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Beschreibung</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={task?.description ?? ""}
          placeholder="Kurze Beschreibung der Aufgabe"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="estimated_hours">Geschätzte Stunden *</Label>
          <Input
            type="number"
            id="estimated_hours"
            name="estimated_hours"
            required
            min="0.25"
            step="0.25"
            defaultValue={task?.estimated_hours}
            placeholder="z.B. 4"
          />
        </div>

        {task && (
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select id="status" name="status" defaultValue={task.status}>
              <option value="todo">Offen</option>
              <option value="in_progress">In Bearbeitung</option>
              <option value="done">Erledigt</option>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Checkliste</Label>
        <div className="space-y-2 mt-1">
          {checklist.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <Input
                value={item.text}
                onChange={(e) => updateItemText(item.id, e.target.value)}
                placeholder="Teilaufgabe…"
              />
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Eintrag entfernen"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-4 w-4" />
            Eintrag hinzufügen
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Speichern…"
            : task
            ? "Änderungen speichern"
            : "Aufgabe erstellen"}
        </Button>
        <a
          href={`/projects/${projectId}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Abbrechen
        </a>
      </div>
    </form>
  );
}
