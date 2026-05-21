"use client";

import { useState, useTransition } from "react";
import { createManualTimeLogAction } from "@/lib/actions/time-logs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

type Props = {
  taskId: string;
  taskName: string;
  projectId: string;
};

export function ManualLogForm({ taskId, taskName, projectId }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createManualTimeLogAction(null, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  if (!open) {
    return (
      <Button
        size="sm"
        variant="ghost"
        className="text-xs px-2 py-1 h-7"
        onClick={() => setOpen(true)}
      >
        + Zeit
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-xl border shadow-lg p-5 max-w-sm w-full mx-4">
        <h3 className="font-semibold mb-1">Zeit erfassen</h3>
        <p className="text-sm text-muted-foreground mb-4">{taskName}</p>

        <form action={handleSubmit} className="space-y-3">
          <input type="hidden" name="task_id" value={taskId} />
          <input type="hidden" name="project_id" value={projectId} />

          <div>
            <Label htmlFor="ml-date">Datum</Label>
            <Input
              id="ml-date"
              name="date"
              type="date"
              defaultValue={todayString()}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ml-start">Startzeit</Label>
              <Input id="ml-start" name="start_time" type="time" required />
            </div>
            <div>
              <Label htmlFor="ml-end">Endzeit</Label>
              <Input id="ml-end" name="end_time" type="time" required />
            </div>
          </div>

          <div>
            <Label htmlFor="ml-notes">Notizen (optional)</Label>
            <Textarea
              id="ml-notes"
              name="notes"
              rows={2}
              placeholder="Was wurde gemacht?"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? "Speichern…" : "Speichern"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Abbrechen
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
