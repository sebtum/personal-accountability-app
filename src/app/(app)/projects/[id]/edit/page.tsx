import { getProject } from "@/lib/data/projects";
import { updateProject } from "@/lib/actions/projects";
import { ProjectForm } from "@/components/projects/project-form";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default async function EditProjectPage({
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
        href="/projects"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Zurück zu Projekten
      </Link>
      <h1 className="text-2xl font-semibold mb-6">Projekt bearbeiten</h1>
      <ProjectForm action={updateProject} project={project} />
    </div>
  );
}
