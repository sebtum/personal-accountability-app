"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

function createChannel(supabase: SupabaseClient, onEvent: () => void): RealtimeChannel {
  return supabase
    .channel("data-sync")
    .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, onEvent)
    .on("postgres_changes", { event: "*", schema: "public", table: "time_logs" }, onEvent)
    .subscribe();
}

export function DataSync() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const onEvent = () => router.refresh();
    let channel = createChannel(supabase, onEvent);

    // Mobile PWAs kill WebSocket connections when backgrounded.
    // Re-subscribe on focus to restore the dead channel.
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        supabase.removeChannel(channel);
        channel = createChannel(supabase, onEvent);
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
