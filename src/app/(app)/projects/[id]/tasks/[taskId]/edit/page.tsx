import { getProject } from "@/lib/data/projects";
import { getTask } from "@/lib/data/tasks";
import { updateTask } from "@/lib/actions/tasks";
import { TaskForm } from "@/components/tasks/task-form";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>;
}) {
  const { id, taskId } = await params;
  const [project, task] = await Promise.all([getProject(id), getTask(taskId)]);
  if (!project || !task) notFound();

  return (
    <div>
      <Link
        href={`/projects/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Zurück zu {project.name}
      </Link>
      <h1 className="text-2xl font-semibold mb-6">Aufgabe bearbeiten</h1>
      <TaskForm action={updateTask} task={task} projectId={id} />
    </div>
  );
}
