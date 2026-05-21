import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskActual = Database["public"]["Views"]["task_actuals"]["Row"];

export async function getTasksByProject(projectId: string): Promise<Task[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

export async function getTaskActualsByProject(projectId: string): Promise<TaskActual[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("task_actuals")
    .select("*")
    .eq("project_id", projectId);
  if (error || !data) return [];
  return data;
}

export async function getTask(id: string): Promise<Task | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error("Datenbankfehler");
  }
  return data;
}
