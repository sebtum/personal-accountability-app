"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type TimeLogActionState = { error: string } | null;

export async function startTimerAction(
  taskId: string,
  projectId: string
): Promise<{ logId: string } | { error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("time_logs")
    .insert({
      task_id: taskId,
      started_at: new Date().toISOString(),
      is_manual: false,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  return { logId: data.id };
}

async function closeTimeLog(
  logId: string,
  endedAt: string
): Promise<TimeLogActionState> {
  const supabase = await createClient();

  const { data: log, error: fetchError } = await supabase
    .from("time_logs")
    .select("started_at")
    .eq("id", logId)
    .single();

  if (fetchError || !log) return { error: "Zeitprotokoll nicht gefunden." };

  const durationMs =
    new Date(endedAt).getTime() - new Date(log.started_at).getTime();
  const durationMinutes = Math.max(0, Math.round(durationMs / 60000));

  const { error } = await supabase
    .from("time_logs")
    .update({ ended_at: endedAt, duration_minutes: durationMinutes })
    .eq("id", logId);

  if (error) return { error: error.message };
  return null;
}

export async function stopTimerAction(
  logId: string,
  projectId: string,
  endedAt: string
): Promise<TimeLogActionState> {
  const result = await closeTimeLog(logId, endedAt);
  if (result) return result;
  revalidatePath(`/projects/${projectId}`);
  return null;
}

export async function resolveOrphanedTimerAction(
  logId: string,
  endedAt: string
): Promise<TimeLogActionState> {
  const result = await closeTimeLog(logId, endedAt);
  if (result) return result;
  revalidatePath("/");
  return null;
}

export async function discardOrphanedTimerAction(
  logId: string
): Promise<TimeLogActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("time_logs")
    .delete()
    .eq("id", logId);

  if (error) return { error: error.message };

  revalidatePath("/");
  return null;
}

export async function createManualTimeLogAction(
  prevState: TimeLogActionState,
  formData: FormData
): Promise<TimeLogActionState> {
  const taskId = formData.get("task_id") as string;
  const projectId = formData.get("project_id") as string;
  const date = formData.get("date") as string;
  const startTime = formData.get("start_time") as string;
  const endTime = formData.get("end_time") as string;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!date || !startTime || !endTime) {
    return { error: "Datum, Startzeit und Endzeit sind Pflichtfelder." };
  }

  const startedAt = new Date(`${date}T${startTime}:00`);
  const endedAt = new Date(`${date}T${endTime}:00`);

  if (endedAt <= startedAt) {
    return { error: "Endzeit muss nach der Startzeit liegen." };
  }

  const durationMinutes = Math.round(
    (endedAt.getTime() - startedAt.getTime()) / 60000
  );

  const supabase = await createClient();
  const { error } = await supabase.from("time_logs").insert({
    task_id: taskId,
    started_at: startedAt.toISOString(),
    ended_at: endedAt.toISOString(),
    duration_minutes: durationMinutes,
    notes,
    is_manual: true,
  });

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  return null;
}
