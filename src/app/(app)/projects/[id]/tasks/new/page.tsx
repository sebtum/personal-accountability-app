import { getProject } from "@/lib/data/projects";
import { createTask } from "@/lib/actions/tasks";
import { TaskForm } from "@/components/tasks/task-form";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default async function NewTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  return (
    <div>
      <Link
        href={`/projects/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Zurück zu {project.name}
      </Link>
      <h1 className="text-2xl font-semibold mb-6">Neue Aufgabe</h1>
      <TaskForm action={createTask} projectId={id} />
    </div>
  );
}
