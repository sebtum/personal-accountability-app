import { cache } from "react";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./server";
import type { Database } from "@/types/database";

/**
 * Reads the session token once per request (cookies OK here — outside unstable_cache).
 * React cache() deduplicates across all callers in the same render.
 */
export const getAuthToken = cache(async (): Promise<string> => {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? "";
});

/**
 * Creates a Supabase client authenticated via Bearer token — no cookies.
 * Safe to call inside unstable_cache.
 */
export function createCacheClient(token: string) {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    }
  );
}
