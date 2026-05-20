"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { TaskStatus, ChecklistItem } from "@/types/database";

export type TaskActionState = { error: string } | null;

export async function createTask(
  prevState: TaskActionState,
  formData: FormData
): Promise<TaskActionState> {
  const project_id = formData.get("project_id") as string;
  const name = (formData.get("name") as string).trim();
  const description = (formData.get("description") as string).trim() || null;
  const estimated_hours = parseFloat(formData.get("estimated_hours") as string);
  const checklistRaw = formData.get("checklist") as string;

  if (!name) return { error: "Name ist ein Pflichtfeld." };
  if (isNaN(estimated_hours) || estimated_hours <= 0) {
    return { error: "Geschätzte Stunden müssen größer als 0 sein." };
  }

  let checklist: ChecklistItem[] = [];
  try {
    checklist = JSON.parse(checklistRaw || "[]");
  } catch {
    return { error: "Checkliste konnte nicht verarbeitet werden." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    project_id,
    name,
    description,
    estimated_hours,
    checklist,
    status: "todo",
  });

  if (error) return { error: error.message };

  revalidatePath(`/projects/${project_id}`);
  redirect(`/projects/${project_id}`);
}

export async function updateTask(
  prevState: TaskActionState,
  formData: FormData
): Promise<TaskActionState> {
  const id = formData.get("id") as string;
  const project_id = formData.get("project_id") as string;
  const name = (formData.get("name") as string).trim();
  const description = (formData.get("description") as string).trim() || null;
  const estimated_hours = parseFloat(formData.get("estimated_hours") as string);
  const status = formData.get("status") as TaskStatus;
  const checklistRaw = formData.get("checklist") as string;

  if (!name) return { error: "Name ist ein Pflichtfeld." };
  if (isNaN(estimated_hours) || estimated_hours <= 0) {
    return { error: "Geschätzte Stunden müssen größer als 0 sein." };
  }

  let checklist: ChecklistItem[] = [];
  try {
    checklist = JSON.parse(checklistRaw || "[]");
  } catch {
    return { error: "Checkliste konnte nicht verarbeitet werden." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ name, description, estimated_hours, status, checklist })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${project_id}`);
  redirect(`/projects/${project_id}`);
}

export async function deleteTask(formData: FormData): Promise<void> {
  const id = formData.get("id") as string;
  const project_id = formData.get("project_id") as string;
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", id);
  revalidatePath(`/projects/${project_id}`);
  redirect(`/projects/${project_id}`);
}
