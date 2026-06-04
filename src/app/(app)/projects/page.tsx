import { getProjects } from "@/lib/data/projects";
import { deleteProject } from "@/lib/actions/projects";
import { buttonVariants } from "@/components/ui/button";
import { DeleteForm } from "@/components/delete-form";
import { ProjectStatusSelect } from "@/components/projects/project-status-select";
import { PaginationNav } from "@/components/ui/pagination-nav";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Pencil } from "lucide-react";

function formatDate(d: string) {
  const [y, m, day] = d.split("-");
  return `${day}.${m}.${y}`;
}

const PAGE_SIZE = 20;

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const result = await getProjects(page - 1, PAGE_SIZE);
  const { data: projects, totalPages } = result;

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
        <>
          <div className="grid gap-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="rounded-lg border bg-card flex items-stretch hover:bg-accent/30 transition-colors"
              >
                <Link
                  href={`/projects/${project.id}`}
                  className="flex-1 min-w-0 px-4 py-3 block"
                >
                  <p className="font-medium text-sm truncate mb-0.5">
                    {project.name}
                  </p>
                  {project.description && (
                    <p className="text-muted-foreground text-xs truncate mb-1">
                      {project.description}
                    </p>
                  )}
                  <p className="text-muted-foreground text-xs">
                    {formatDate(project.start_date)} → {formatDate(project.deadline)}
                  </p>
                </Link>

                <div className="flex items-center gap-2 px-4 py-3 shrink-0 border-l">
                  <ProjectStatusSelect id={project.id} status={project.status} />
                  <Link
                    href={`/projects/${project.id}/edit`}
                    className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
                    title="Bearbeiten"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                  <DeleteForm
                    action={deleteProject}
                    confirmMessage={`Projekt „${project.name}" wirklich löschen?`}
                  >
                    <input type="hidden" name="id" value={project.id} />
                  </DeleteForm>
                </div>
              </div>
            ))}
          </div>
          <PaginationNav
            page={page}
            totalPages={totalPages}
            buildHref={(p) => `/projects?page=${p}`}
          />
        </>
      )}
    </div>
  );
}
