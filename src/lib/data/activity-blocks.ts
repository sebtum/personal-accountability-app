/**
 * Grouping of raw time logs into activity blocks.
 *
 * Deliberately free of imports and I/O so the merge rule can be exercised on
 * its own — see the block comment on ACTIVITY_MERGE_GAP_MINUTES for the rule.
 */

/**
 * Consecutive time logs on the SAME task merge into one activity block when the
 * pause between them is at most this long. A longer pause (lunch, a meeting)
 * starts a new block, so a day reads as "morning block / afternoon block"
 * rather than as a list of near-identical session rows.
 */
export const ACTIVITY_MERGE_GAP_MINUTES = 60;

export type ActivitySession = {
  id: string;
  started_at: string;
  ended_at: string;
  duration_minutes: number;
  is_manual: boolean;
  notes: string | null;
};

export type ActivityBlock = {
  id: string; // id of the newest session in the block
  task_id: string;
  task_name: string;
  project_id: string;
  project_name: string;
  started_at: string; // earliest start in the block
  ended_at: string; // latest end in the block
  total_minutes: number; // SUM of session durations, not the wall-clock span
  sessions: ActivitySession[]; // newest first
};


/** Shape of one row from the activity query, after PostgREST embedding. */
export type ActivityRow = {
  id: string;
  task_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  is_manual: boolean;
  notes: string | null;
  tasks: {
    name: string;
    status: string;
    project_id: string;
    projects: { name: string } | null;
  } | null;
};

/**
 * Merges consecutive logs of the same task into blocks (see
 * ACTIVITY_MERGE_GAP_MINUTES). `rows` must be ordered newest-first; the
 * returned blocks and their sessions keep that order.
 *
 * Pure function — no I/O, so it can be reasoned about (and tested) on its own.
 */
export function groupIntoBlocks(rows: ActivityRow[]): ActivityBlock[] {
  const gapMs = ACTIVITY_MERGE_GAP_MINUTES * 60_000;
  const blocks: ActivityBlock[] = [];

  for (const row of rows) {
    if (!row.ended_at) continue; // running timer — not activity yet

    const session: ActivitySession = {
      id: row.id,
      started_at: row.started_at,
      ended_at: row.ended_at,
      duration_minutes: row.duration_minutes ?? 0,
      is_manual: row.is_manual,
      notes: row.notes,
    };

    const current = blocks[blocks.length - 1];
    // We walk backwards in time, so the gap is the block's earliest start
    // minus this (older) row's end.
    const fits =
      current !== undefined &&
      current.task_id === row.task_id &&
      new Date(current.started_at).getTime() - new Date(row.ended_at).getTime() <= gapMs;

    if (fits) {
      current.sessions.push(session);
      current.total_minutes += session.duration_minutes;
      if (new Date(session.started_at) < new Date(current.started_at)) {
        current.started_at = session.started_at;
      }
      if (new Date(session.ended_at) > new Date(current.ended_at)) {
        current.ended_at = session.ended_at;
      }
      continue;
    }

    blocks.push({
      id: row.id,
      task_id: row.task_id,
      task_name: row.tasks?.name ?? "–",
      project_id: row.tasks?.project_id ?? "",
      project_name: row.tasks?.projects?.name ?? "–",
      started_at: session.started_at,
      ended_at: session.ended_at,
      total_minutes: session.duration_minutes,
      sessions: [session],
    });
  }

  return blocks;
}
