import { unstable_cache } from "next/cache";
import { cache } from "react";
import { createCacheClient, getAuthToken } from "@/lib/supabase/server-cache";
import type { Database, PaginatedResult } from "@/types/database";

type Project = Database["public"]["Tables"]["projects"]["Row"];

const PROJECT_FIELDS =
  "id,name,description,status,start_date,deadline,created_at" as const;

// Module-level stable reference — unstable_cache key is deterministic
const _cachedGetProjects = unstable_cache(
  async (token: string, page: number, pageSize: number): Promise<PaginatedResult<Project>> => {
    const supabase = createCacheClient(token); // no cookies inside cache
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
  },
  ["projects"],
  { tags: ["projects"] }
);

// Reads cookies once outside the cache, then delegates
export const getProjects = cache(async (
  page: number = 0,
  pageSize: number = 20
): Promise<PaginatedResult<Project>> => {
  const token = await getAuthToken();
  return _cachedGetProjects(token, page, pageSize);
});

export const getProject = cache(async (id: string): Promise<Project | null> => {
  const token = await getAuthToken();
  return unstable_cache(
    async (tok: string, projectId: string) => {
      const supabase = createCacheClient(tok);
      const { data, error } = await supabase
        .from("projects")
        .select("id,name,description,status,start_date,deadline")
        .eq("id", projectId)
        .single();
      if (error) {
        if (error.code === "PGRST116") return null;
        throw new Error("Datenbankfehler");
      }
      return data as unknown as Project;
    },
    [`project-${id}`],
    { tags: ["projects", `project-${id}`] }
  )(token, id);
});
