"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTimerStore } from "@/store/index";
import { useRouter } from "next/navigation";

export function useTimerSync(activeLogId: string | null) {
  const stopTimer = useTimerStore((s) => s.stopTimer);
  const router = useRouter();

  useEffect(() => {
    if (!activeLogId) return;

    const supabase = createClient();

    const createChannel = () =>
      supabase
        .channel(`timer-sync-${activeLogId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "time_logs",
            filter: `id=eq.${activeLogId}`,
          },
          (payload) => {
            if ((payload.new as { ended_at: string | null }).ended_at !== null) {
              stopTimer();
              router.refresh();
            }
          }
        )
        .subscribe();

    let channel = createChannel();

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        supabase.removeChannel(channel);
        channel = createChannel();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      supabase.removeChannel(channel);
    };
  }, [activeLogId, stopTimer, router]);
}
