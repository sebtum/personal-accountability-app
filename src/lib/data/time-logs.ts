import { createClient } from "@/lib/supabase/server";
import type { Database, PaginatedResult } from "@/types/database";

export type TimeLog = Database["public"]["Tables"]["time_logs"]["Row"];

export type OrphanedTimer = TimeLog & {
  task_name: string;
  project_id: string;
};

type TimeLogWithTask = TimeLog & {
  tasks: { name: string; project_id: string } | null;
};

export async function getOrphanedTimer(): Promise<OrphanedTimer | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("time_logs")
    .select("id,task_id,started_at,ended_at,duration_minutes,notes,is_manual,created_at, tasks(name, project_id)")
    .is("ended_at", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (error || !data) return null;

  const row = data as unknown as TimeLogWithTask;
  const task = row.tasks;
  if (!task) return null;

  return {
    id: row.id,
    task_id: row.task_id,
    started_at: row.started_at,
    ended_at: row.ended_at,
    duration_minutes: row.duration_minutes,
    notes: row.notes,
    is_manual: row.is_manual,
    created_at: row.created_at,
    task_name: task.name,
    project_id: task.project_id,
  };
}

export async function getTimeLogsByTask(
  taskId: string,
  page: number = 0,
  pageSize: number = 20
): Promise<PaginatedResult<TimeLog>> {
  const supabase = await createClient();
  const { data, count, error } = await supabase
    .from("time_logs")
    .select("id,started_at,ended_at,duration_minutes,notes,is_manual", { count: "exact" })
    .eq("task_id", taskId)
    .not("ended_at", "is", null)
    .order("started_at", { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (error || !data) return { data: [], count: 0, page, pageSize, totalPages: 0 };
  return {
    data: data as unknown as TimeLog[],
    count: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}
