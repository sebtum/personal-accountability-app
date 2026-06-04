import { createClient } from "@/lib/supabase/server";
import type { Database, PaginatedResult } from "@/types/database";

type Project = Database["public"]["Tables"]["projects"]["Row"];

const PROJECT_FIELDS =
  "id,name,description,status,start_date,deadline,created_at" as const;

export async function getProjects(
  page: number = 0,
  pageSize: number = 20
): Promise<PaginatedResult<Project>> {
  const supabase = await createClient();
  const { data, count, error } = await supabase
    .from("projects")
    .select(PROJECT_FIELDS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);
  if (error) throw new Error(error.message);
  return {
    data: (data ?? []) as unknown as Project[],
    count: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function getProject(id: string): Promise<Project | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id,name,description,status,start_date,deadline")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error("Datenbankfehler");
  }
  return data as unknown as Project;
}
