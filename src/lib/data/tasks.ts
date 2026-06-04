import { createClient } from "@/lib/supabase/server";
import type { Database, PaginatedResult } from "@/types/database";

type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskActual = Database["public"]["Views"]["task_actuals"]["Row"];

export async function getTasksByProject(
  projectId: string,
  page: number = 0,
  pageSize: number = 20
): Promise<PaginatedResult<Task>> {
  const supabase = await createClient();
  const { data, count, error } = await supabase
    .from("tasks")
    .select("id,project_id,name,status,estimated_hours,checklist,created_at", { count: "exact" })
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })
    .range(page * pageSize, (page + 1) * pageSize - 1);
  if (error) throw new Error(error.message);
  return {
    data: (data ?? []) as unknown as Task[],
    count: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function getTaskActualsByProject(projectId: string): Promise<TaskActual[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("task_actuals")
    .select("task_id,actual_hours,is_overrun,status,estimated_hours")
    .eq("project_id", projectId);
  if (error || !data) return [];
  return data as unknown as TaskActual[];
}

export async function getTask(id: string): Promise<Task | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id,project_id,name,description,status,estimated_hours,checklist")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error("Datenbankfehler");
  }
  return data as unknown as Task;
}
