"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function DataSync() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("data-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" },
        () => router.refresh()
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "time_logs" },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
