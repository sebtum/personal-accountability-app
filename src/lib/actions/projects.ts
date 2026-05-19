"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ProjectStatus } from "@/types/database";

export type ProjectActionState = { error: string } | null;

export async function createProject(
  prevState: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  const name = (formData.get("name") as string).trim();
  const description = (formData.get("description") as string).trim() || null;
  const start_date = formData.get("start_date") as string;
  const deadline = formData.get("deadline") as string;

  if (!name || !start_date || !deadline) {
    return { error: "Name, Startdatum und Deadline sind Pflichtfelder." };
  }
  if (deadline < start_date) {
    return { error: "Deadline muss nach dem Startdatum liegen." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .insert({ name, description, start_date, deadline, status: "active" });

  if (error) return { error: error.message };

  revalidatePath("/projects");
  redirect("/projects");
}

export async function updateProject(
  prevState: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string).trim();
  const description = (formData.get("description") as string).trim() || null;
  const start_date = formData.get("start_date") as string;
  const deadline = formData.get("deadline") as string;
  const status = formData.get("status") as ProjectStatus;

  if (!name || !start_date || !deadline) {
    return { error: "Name, Startdatum und Deadline sind Pflichtfelder." };
  }
  if (deadline < start_date) {
    return { error: "Deadline muss nach dem Startdatum liegen." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ name, description, start_date, deadline, status })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/projects");
  redirect("/projects");
}

export async function deleteProject(formData: FormData): Promise<void> {
  const id = formData.get("id") as string;
  const supabase = await createClient();
  await supabase.from("projects").delete().eq("id", id);
  revalidatePath("/projects");
  redirect("/projects");
}
