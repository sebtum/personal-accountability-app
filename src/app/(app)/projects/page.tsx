import { getProjects } from "@/lib/data/projects";
import { deleteProject } from "@/lib/actions/projects";
import { buttonVariants } from "@/components/ui/button";
import { DeleteForm } from "@/components/delete-form";
import { ProjectStatusSelect } from "@/components/projects/project-status-select";
import { PaginationNav } from "@/components/ui/pagination-nav";
import { cn } from "@/lib/utils";
import type { Database, PaginatedResult } from "@/types/database";
import Link from "next/link";
import { ChevronRight, Pencil } from "lucide-react";

type Project = Database["public"]["Tables"]["projects"]["Row"];
type PageParams = { page: number; cpage: number; apage: number };

function formatDate(d: string) {
  const [y, m, day] = d.split("-");
  return `${day}.${m}.${y}`;
}

function parsePage(value: string | undefined) {
  const n = parseInt(value ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

// `keep` stays in the URL even on page 1 so its section remains open after navigation
function buildHref(params: PageParams, keep?: keyof PageParams) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value > 1 || key === keep) qs.set(key, String(value));
  }
  const s = qs.toString();
  return s ? `/projects?${s}` : "/projects";
}

const PAGE_SIZE = 20;

function ProjectRow({ project, muted }: { project: Project; muted?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card flex items-stretch hover:bg-accent/30 transition-colors",
        muted && "opacity-70"
      )}
    >
      <Link
        href={`/projects/${project.id}`}
        className="flex-1 min-w-0 px-4 py-3 block"
      >
        <p className="font-medium text-sm truncate mb-0.5">{project.name}</p>
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
          confirmMessage={`Projekt „${project.name}" wirklich löschen? Alle Tasks und erfassten Zeiten gehen verloren – zum Behalten stattdessen archivieren.`}
        >
          <input type="hidden" name="id" value={project.id} />
        </DeleteForm>
      </div>
    </div>
  );
}

function ProjectList({
  result,
  page,
  buildPageHref,
  muted,
}: {
  result: PaginatedResult<Project>;
  page: number;
  buildPageHref: (p: number) => string;
  muted?: boolean;
}) {
  return (
    <>
      <div className="grid gap-3">
        {result.data.map((project) => (
          <ProjectRow key={project.id} project={project} muted={muted} />
        ))}
      </div>
      <PaginationNav
        page={page}
        totalPages={result.totalPages}
        buildHref={buildPageHref}
      />
    </>
  );
}

function CollapsedSection({
  title,
  open,
  children,
}: {
  title: string;
  open: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={open} className="group mt-8">
      <summary className="flex items-center gap-1.5 cursor-pointer select-none list-none text-sm font-medium text-muted-foreground hover:text-foreground mb-3 [&::-webkit-details-marker]:hidden">
        <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
        {title}
      </summary>
      {children}
    </details>
  );
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; cpage?: string; apage?: string }>;
}) {
  const sp = await searchParams;
  const params: PageParams = {
    page: parsePage(sp.page),
    cpage: parsePage(sp.cpage),
    apage: parsePage(sp.apage),
  };

  const [active, completed, archived] = await Promise.all([
    getProjects(params.page - 1, PAGE_SIZE, "active"),
    getProjects(params.cpage - 1, PAGE_SIZE, "completed"),
    getProjects(params.apage - 1, PAGE_SIZE, "archived"),
  ]);

  const hasOthers = completed.count > 0 || archived.count > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Projekte</h1>
        <Link href="/projects/new" className={cn(buttonVariants())}>
          + Neues Projekt
        </Link>
      </div>

      {active.count === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">
            {hasOthers
              ? "Keine aktiven Projekte."
              : "Noch keine Projekte. Erstelle dein erstes Projekt."}
          </p>
        </div>
      ) : (
        <ProjectList
          result={active}
          page={params.page}
          buildPageHref={(p) => buildHref({ ...params, page: p })}
        />
      )}

      {completed.count > 0 && (
        <CollapsedSection
          title={`Abgeschlossen (${completed.count})`}
          open={sp.cpage !== undefined}
        >
          <ProjectList
            result={completed}
            page={params.cpage}
            buildPageHref={(p) => buildHref({ ...params, cpage: p }, "cpage")}
          />
        </CollapsedSection>
      )}

      {archived.count > 0 && (
        <CollapsedSection
          title={`Archiviert (${archived.count})`}
          open={sp.apage !== undefined}
        >
          <ProjectList
            result={archived}
            page={params.apage}
            buildPageHref={(p) => buildHref({ ...params, apage: p }, "apage")}
            muted
          />
        </CollapsedSection>
      )}
    </div>
  );
}
