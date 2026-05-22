import { getProject } from "@/lib/data/projects";
import { getTasksByProject, getTaskActualsByProject } from "@/lib/data/tasks";
import { deleteTask } from "@/lib/actions/tasks";
import { buttonVariants } from "@/components/ui/button";
import { DeleteForm } from "@/components/delete-form";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { Database } from "@/types/database";
import { TaskTimerButton } from "@/components/timer/task-timer-button";
import { ManualLogForm } from "@/components/timer/manual-log-form";
import { TaskChecklist } from "@/components/tasks/task-checklist";

type Task = Database["public"]["Tables"]["tasks"]["Row"];

const TASK_STATUS_LABELS: Record<Task["status"], string> = {
  todo: "Offen",
  in_progress: "In Bearbeitung",
  done: "Erledigt",
};

const TASK_STATUS_CLASSES: Record<Task["status"], string> = {
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/10 text-primary",
  done: "bg-muted text-muted-foreground",
};

const PROJECT_STATUS_LABELS: Record<
  Database["public"]["Tables"]["projects"]["Row"]["status"],
  string
> = {
  active: "Aktiv",
  completed: "Abgeschlossen",
  archived: "Archiviert",
};

function formatDate(d: string) {
  const [y, m, day] = d.split("-");
  return `${day}.${m}.${y}`;
}

function formatActualHours(hours: number): string {
  if (hours <= 0) return "";
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}


export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, tasks, actuals] = await Promise.all([
    getProject(id),
    getTasksByProject(id),
    getTaskActualsByProject(id),
  ]);
  const actualsMap = new Map(actuals.map((a) => [a.task_id, a]));
  if (!project) notFound();

  const totalHours = tasks.reduce((sum, t) => sum + t.estimated_hours, 0);
  const byStatus = {
    todo: tasks.filter((t) => t.status === "todo").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  const sorted = [...tasks].sort((a, b) => {
    const order = { in_progress: 0, todo: 1, done: 2 };
    return order[a.status] - order[b.status];
  });

  return (
    <div>
      <Link
        href="/projects"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Alle Projekte
      </Link>

      {/* Project header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
            {PROJECT_STATUS_LABELS[project.status]}
          </span>
        </div>
        {project.description && (
          <p className="text-muted-foreground text-sm mb-2">
            {project.description}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {formatDate(project.start_date)} → {formatDate(project.deadline)}
        </p>
      </div>

      {/* Task list header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="font-medium">Aufgaben</h2>
          {tasks.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {byStatus.in_progress > 0 && `${byStatus.in_progress} aktiv · `}
              {byStatus.todo > 0 && `${byStatus.todo} offen · `}
              {byStatus.done > 0 && `${byStatus.done} erledigt · `}
              {totalHours}h geschätzt
            </span>
          )}
        </div>
        <Link
          href={`/projects/${id}/tasks/new`}
          className={cn(buttonVariants({ size: "sm" }))}
        >
          + Neue Aufgabe
        </Link>
      </div>

      {/* Task list */}
      {tasks.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">
            Noch keine Aufgaben. Erstelle die erste Aufgabe für dieses Projekt.
          </p>
        </div>
      ) : (
        <div className="grid gap-2">
          {sorted.map((task) => (
            <div
              key={task.id}
              className="rounded-lg border bg-card px-4 py-3 flex items-start justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      "font-medium text-sm",
                      task.status === "done" &&
                        "line-through text-muted-foreground"
                    )}
                  >
                    {task.name}
                  </span>
                  <span
                    className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${TASK_STATUS_CLASSES[task.status]}`}
                  >
                    {TASK_STATUS_LABELS[task.status]}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-muted-foreground">
                    {task.estimated_hours}h geschätzt
                  </span>
                  {(() => {
                    const actual = actualsMap.get(task.id);
                    const formatted = formatActualHours(actual?.actual_hours ?? 0);
                    if (!formatted) return null;
                    return (
                      <span
                        className={`text-xs font-medium ${actual?.is_overrun ? "text-destructive" : "text-primary"}`}
                      >
                        {formatted} erfasst{actual?.is_overrun ? " ⚠" : ""}
                      </span>
                    );
                  })()}
                </div>
                <TaskChecklist
                  taskId={task.id}
                  projectId={id}
                  checklist={task.checklist}
                />
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                {task.status !== "done" && (
                  <TaskTimerButton taskId={task.id} projectId={id} />
                )}
                <ManualLogForm
                  taskId={task.id}
                  taskName={task.name}
                  projectId={id}
                />
                <Link
                  href={`/projects/${id}/tasks/${task.id}/edit`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Bearbeiten
                </Link>
                <DeleteForm
                  action={deleteTask}
                  confirmMessage={`Aufgabe „${task.name}" wirklich löschen?`}
                >
                  <input type="hidden" name="id" value={task.id} />
                  <input type="hidden" name="project_id" value={id} />
                </DeleteForm>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
