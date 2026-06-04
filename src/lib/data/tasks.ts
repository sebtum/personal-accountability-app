import { unstable_cache } from "next/cache";
import { cache } from "react";
import { createCacheClient, getAuthToken } from "@/lib/supabase/server-cache";
import type { Database, PaginatedResult } from "@/types/database";

type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskActual = Database["public"]["Views"]["task_actuals"]["Row"];

export const getTasksByProject = cache(async (
  projectId: string,
  page: number = 0,
  pageSize: number = 20
): Promise<PaginatedResult<Task>> => {
  const token = await getAuthToken();
  return unstable_cache(
    async (tok: string, pid: string, p: number, ps: number) => {
      const supabase = createCacheClient(tok);
      const { data, count, error } = await supabase
        .from("tasks")
        .select("id,project_id,name,status,estimated_hours,checklist,created_at", { count: "exact" })
        .eq("project_id", pid)
        .order("created_at", { ascending: true })
        .range(p * ps, (p + 1) * ps - 1);
      if (error) throw new Error(error.message);
      return {
        data: (data ?? []) as unknown as Task[],
        count: count ?? 0,
        page: p,
        pageSize: ps,
        totalPages: Math.ceil((count ?? 0) / ps),
      };
    },
    [`tasks-${projectId}`],
    { tags: [`tasks-${projectId}`] }
  )(token, projectId, page, pageSize);
});

export const getTaskActualsByProject = cache(async (projectId: string): Promise<TaskActual[]> => {
  const token = await getAuthToken();
  return unstable_cache(
    async (tok: string, pid: string) => {
      const supabase = createCacheClient(tok);
      const { data, error } = await supabase
        .from("task_actuals")
        .select("task_id,actual_hours,is_overrun,status,estimated_hours")
        .eq("project_id", pid);
      if (error || !data) return [];
      return data as unknown as TaskActual[];
    },
    [`task-actuals-${projectId}`],
    { tags: [`tasks-${projectId}`] }
  )(token, projectId);
});

export const getTask = cache(async (id: string): Promise<Task | null> => {
  const token = await getAuthToken();
  return unstable_cache(
    async (tok: string, taskId: string) => {
      const supabase = createCacheClient(tok);
      const { data, error } = await supabase
        .from("tasks")
        .select("id,project_id,name,description,status,estimated_hours,checklist")
        .eq("id", taskId)
        .single();
      if (error) {
        if (error.code === "PGRST116") return null;
        throw new Error("Datenbankfehler");
      }
      return data as unknown as Task;
    },
    [`task-${id}`],
    { tags: [`task-${id}`] }
  )(token, id);
});
