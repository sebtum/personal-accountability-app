import { createProject } from "@/lib/actions/projects";
import { ProjectForm } from "@/components/projects/project-form";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function NewProjectPage() {
  return (
    <div>
      <Link
        href="/projects"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Zurück zu Projekten
      </Link>
      <h1 className="text-2xl font-semibold mb-6">Neues Projekt</h1>
      <ProjectForm action={createProject} />
    </div>
  );
}
