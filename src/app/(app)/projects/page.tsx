import { getProjects } from "@/lib/data/projects";
import { deleteProject } from "@/lib/actions/projects";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { Database } from "@/types/database";

type Project = Database["public"]["Tables"]["projects"]["Row"];

const STATUS_LABELS: Record<Project["status"], string> = {
  active: "Aktiv",
  completed: "Abgeschlossen",
  archived: "Archiviert",
};

const STATUS_CLASSES: Record<Project["status"], string> = {
  active: "bg-primary/10 text-primary",
  completed: "bg-muted text-muted-foreground line-through",
  archived: "bg-muted text-muted-foreground",
};

function formatDate(d: string) {
  const [y, m, day] = d.split("-");
  return `${day}.${m}.${y}`;
}

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Projekte</h1>
        <Link href="/projects/new" className={cn(buttonVariants())}>
          + Neues Projekt
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">
            Noch keine Projekte. Erstelle dein erstes Projekt.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="rounded-lg border bg-card px-4 py-3 flex items-start justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    href={`/projects/${project.id}`}
                    className="font-medium text-sm truncate hover:underline"
                  >
                    {project.name}
                  </Link>
                  <span
                    className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASSES[project.status]}`}
                  >
                    {STATUS_LABELS[project.status]}
                  </span>
                </div>
                {project.description && (
                  <p className="text-muted-foreground text-xs truncate mb-1">
                    {project.description}
                  </p>
                )}
                <p className="text-muted-foreground text-xs">
                  {formatDate(project.start_date)} → {formatDate(project.deadline)}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/projects/${project.id}/edit`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Bearbeiten
                </Link>
                <form action={deleteProject}>
                  <input type="hidden" name="id" value={project.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    Löschen
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
