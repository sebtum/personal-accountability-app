"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

export type TimeLogActionState = { error: string } | null;

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return supabase;
}

export async function startTimerAction(
  taskId: string
): Promise<{ logId: string } | { error: string }> {
  const supabase = await requireUser();

  const { count } = await supabase
    .from("time_logs")
    .select("id", { count: "exact", head: true })
    .is("ended_at", null);

  if (count && count > 0) {
    return { error: "Es läuft bereits ein Timer. Bitte zuerst stoppen." };
  }

  const { data, error } = await supabase
    .from("time_logs")
    .insert({
      task_id: taskId,
      started_at: new Date().toISOString(),
      is_manual: false,
    })
    .select("id")
    .single();

  if (error) return { error: "Timer konnte nicht gestartet werden." };

  return { logId: data.id };
}

async function closeTimeLog(
  logId: string,
  endedAt: string
): Promise<TimeLogActionState> {
  const endedAtDate = new Date(endedAt);
  if (isNaN(endedAtDate.getTime())) return { error: "Ungültige Endzeit." };

  const supabase = await requireUser();

  const { data: log, error: fetchError } = await supabase
    .from("time_logs")
    .select("started_at")
    .eq("id", logId)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") return null; // already stopped or deleted
    return { error: "Zeitprotokoll konnte nicht geladen werden." };
  }
  if (!log) return null;

  const durationMs = endedAtDate.getTime() - new Date(log.started_at).getTime();
  const durationMinutes = Math.max(0, Math.round(durationMs / 60000));

  const { error } = await supabase
    .from("time_logs")
    .update({ ended_at: endedAt, duration_minutes: durationMinutes })
    .eq("id", logId);

  if (error) return { error: "Zeitprotokoll konnte nicht gespeichert werden." };
  return null;
}

export async function stopTimerAction(
  logId: string,
  projectId: string,
  endedAt: string,
  taskId: string
): Promise<TimeLogActionState> {
  const result = await closeTimeLog(logId, endedAt);
  if (result) return result;
  revalidateTag("dashboard", {});
  revalidateTag(`time-logs-${taskId}`, {});
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/");
  return null;
}

export async function resolveOrphanedTimerAction(
  logId: string,
  endedAt: string
): Promise<TimeLogActionState> {
  const result = await closeTimeLog(logId, endedAt);
  if (result) return result;
  revalidateTag("dashboard", {});
  revalidatePath("/");
  revalidatePath("/projects", "layout");
  return null;
}

export async function discardOrphanedTimerAction(
  logId: string
): Promise<TimeLogActionState> {
  const supabase = await requireUser();
  const { error } = await supabase
    .from("time_logs")
    .delete()
    .eq("id", logId);

  if (error) return { error: "Zeitprotokoll konnte nicht gelöscht werden." };

  revalidateTag("dashboard", {});
  revalidatePath("/");
  return null;
}

export async function createManualTimeLogAction(
  prevState: TimeLogActionState,
  formData: FormData
): Promise<TimeLogActionState> {
  const taskId = formData.get("task_id") as string;
  const projectId = formData.get("project_id") as string;
  const startedAtISO = formData.get("started_at_iso") as string;
  const endedAtISO = formData.get("ended_at_iso") as string;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!startedAtISO || !endedAtISO) {
    return { error: "Datum, Startzeit und Endzeit sind Pflichtfelder." };
  }

  const startedAt = new Date(startedAtISO);
  const endedAt = new Date(endedAtISO);

  if (isNaN(startedAt.getTime()) || isNaN(endedAt.getTime())) {
    return { error: "Ungültiges Datum oder Uhrzeit." };
  }
  if (endedAt <= startedAt) {
    return { error: "Endzeit muss nach der Startzeit liegen." };
  }

  const durationMinutes = Math.round(
    (endedAt.getTime() - startedAt.getTime()) / 60000
  );

  const supabase = await requireUser();
  const { error } = await supabase.from("time_logs").insert({
    task_id: taskId,
    started_at: startedAt.toISOString(),
    ended_at: endedAt.toISOString(),
    duration_minutes: durationMinutes,
    notes,
    is_manual: true,
  });

  if (error) return { error: "Zeiteintrag konnte nicht gespeichert werden." };

  revalidateTag("dashboard", {});
  revalidateTag(`time-logs-${taskId}`, {});
  revalidatePath(`/projects/${projectId}`);
  return null;
}
