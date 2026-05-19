"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import type { Database } from "@/types/database";
import type { ProjectActionState } from "@/lib/actions/projects";

type Project = Database["public"]["Tables"]["projects"]["Row"];

interface ProjectFormProps {
  action: (
    prevState: ProjectActionState,
    formData: FormData
  ) => Promise<ProjectActionState>;
  project?: Project;
}

export function ProjectForm({ action, project }: ProjectFormProps) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-5 max-w-lg">
      {project && <input type="hidden" name="id" value={project.id} />}

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
          defaultValue={project?.name}
          placeholder="z.B. Website Redesign"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Beschreibung</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={project?.description ?? ""}
          placeholder="Kurze Beschreibung des Projekts"
        />
      </div>

      {project && (
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={project.status}>
            <option value="active">Aktiv</option>
            <option value="completed">Abgeschlossen</option>
            <option value="archived">Archiviert</option>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="start_date">Startdatum *</Label>
          <Input
            type="date"
            id="start_date"
            name="start_date"
            required
            defaultValue={project?.start_date}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deadline">Deadline *</Label>
          <Input
            type="date"
            id="deadline"
            name="deadline"
            required
            defaultValue={project?.deadline}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Speichern…"
            : project
            ? "Änderungen speichern"
            : "Projekt erstellen"}
        </Button>
        <a href="/projects" className="text-sm text-muted-foreground hover:text-foreground">
          Abbrechen
        </a>
      </div>
    </form>
  );
}
