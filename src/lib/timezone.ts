// Single-user app — timezone is hardcoded rather than per-user.
export const APP_TIMEZONE = "Europe/Berlin";

export type CivilDate = { year: number; month: number; day: number };
export type ZonedParts = CivilDate & {
  hour: number;
  minute: number;
  second: number;
  weekdayMon0: number; // 0=Mon .. 6=Sun
};

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    formatterCache.set(timeZone, formatter);
  }
  return formatter;
}

/** Wall-clock date/time components of `instant` as seen in `timeZone`. */
export function getZonedParts(instant: Date, timeZone: string = APP_TIMEZONE): ZonedParts {
  const parts = getFormatter(timeZone).formatToParts(instant);
  const map: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== "literal") map[part.type] = Number(part.value);
  }
  const year = map.year;
  const month = map.month;
  const day = map.day;
  const hour = (map.hour ?? 0) % 24; // some ICU versions emit "24" for midnight
  const minute = map.minute ?? 0;
  const second = map.second ?? 0;
  const weekdayMon0 = (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
  return { year, month, day, hour, minute, second, weekdayMon0 };
}

/**
 * Converts civil (wall-clock) date/time components in `timeZone` back into a
 * real UTC instant. Uses a guess-and-correct technique (2 iterations, enough
 * since a given IANA zone only ever has two possible UTC offsets in effect).
 *
 * Not spec-perfect across a DST spring-forward gap / fall-back fold — accepted
 * limitation, since every caller only asks for midnight or top-of-hour
 * boundaries, and Germany's transitions land at 02:00-03:00 local, never at
 * midnight or default hour boundaries used here.
 */
export function zonedPartsToUtc(
  civil: { year: number; month: number; day: number; hour: number; minute: number; second: number },
  timeZone: string = APP_TIMEZONE
): Date {
  const { year, month, day, hour, minute, second } = civil;
  const naiveMs = Date.UTC(year, month - 1, day, hour, minute, second);
  let candidateMs = naiveMs;
  for (let i = 0; i < 2; i++) {
    const seen = getZonedParts(new Date(candidateMs), timeZone);
    const seenMs = Date.UTC(seen.year, seen.month - 1, seen.day, seen.hour, seen.minute, seen.second);
    const offsetMs = seenMs - candidateMs;
    candidateMs = naiveMs - offsetMs;
  }
  return new Date(candidateMs);
}

/** Adds `days` to a civil date using pure calendar arithmetic (no timezone involved). */
export function addCivilDays(civil: CivilDate, days: number): CivilDate {
  const d = new Date(Date.UTC(civil.year, civil.month - 1, civil.day));
  d.setUTCDate(d.getUTCDate() + days);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/** "YYYY-MM-DD" — safe to use as a Map key. */
export function civilDateKey(civil: CivilDate): string {
  const y = String(civil.year).padStart(4, "0");
  const m = String(civil.month).padStart(2, "0");
  const d = String(civil.day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "DD.MM." */
export function formatCivilShortDate(civil: CivilDate): string {
  return `${String(civil.day).padStart(2, "0")}.${String(civil.month).padStart(2, "0")}.`;
}

/** Same week-number heuristic previously computed via `Date` getters, now on pure civil components. */
export function isoWeekNumber(civil: CivilDate): number {
  const d = new Date(Date.UTC(civil.year, civil.month - 1, civil.day));
  d.setUTCDate(d.getUTCDate() + 3);
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart) / 86400000 + 1) / 7);
}

/** Real UTC instant of local midnight for the civil day containing `instant`. */
export function startOfZonedDay(instant: Date, timeZone: string = APP_TIMEZONE): Date {
  const civil = getZonedParts(instant, timeZone);
  return zonedPartsToUtc({ ...civil, hour: 0, minute: 0, second: 0 }, timeZone);
}

/** Real UTC instant of the Monday 00:00 local that starts the week containing `instant`. */
export function startOfZonedWeek(instant: Date, timeZone: string = APP_TIMEZONE): Date {
  const civil = getZonedParts(instant, timeZone);
  const monday = addCivilDays(civil, -civil.weekdayMon0);
  return zonedPartsToUtc({ ...monday, hour: 0, minute: 0, second: 0 }, timeZone);
}

/** Real UTC instant of the next local clock-hour boundary after `instant`. */
export function nextZonedHourBoundaryUtc(instant: Date, timeZone: string = APP_TIMEZONE): Date {
  const civil = getZonedParts(instant, timeZone);
  return zonedPartsToUtc(
    { year: civil.year, month: civil.month, day: civil.day, hour: civil.hour + 1, minute: 0, second: 0 },
    timeZone
  );
}
