import { DayHourChart } from "@/components/dashboard/day-hour-chart";
import { DayPicker, type WeekDay } from "@/components/day-picker";
import { getDayDistribution, parseDayKey, todayDayKey } from "@/lib/data/day-distribution";
import { addCivilDays, civilDateKey, formatCivilShortDate } from "@/lib/timezone";
import { formatMinutes } from "@/lib/utils";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export default async function TagesverlaufPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const todayKey = todayDayKey();

  // Invalid values fall back to today; future days are clamped to today.
  const parsed = parseDayKey(date);
  const requestedKey = parsed ? civilDateKey(parsed) : todayKey;
  const dateKey = requestedKey > todayKey ? todayKey : requestedKey;
  const civil = parseDayKey(dateKey)!;

  const weekdayMon0 = (new Date(Date.UTC(civil.year, civil.month - 1, civil.day)).getUTCDay() + 6) % 7;
  const monday = addCivilDays(civil, -weekdayMon0);
  const weekDays: WeekDay[] = WEEKDAYS.map((label, i) => {
    const dayCivil = addCivilDays(monday, i);
    const key = civilDateKey(dayCivil);
    return {
      key,
      label: `${label} ${formatCivilShortDate(dayCivil)}`,
      selected: key === dateKey,
      future: key > todayKey,
    };
  });

  const prevKey = civilDateKey(addCivilDays(civil, -1));
  const nextKey = dateKey < todayKey ? civilDateKey(addCivilDays(civil, 1)) : null;

  const data = await getDayDistribution(dateKey);
  const title = `${WEEKDAYS[weekdayMon0]}, ${String(civil.day).padStart(2, "0")}.${String(civil.month).padStart(2, "0")}.${civil.year}`;
  const first = data.sessions[0];
  const last = data.sessions.reduce<string | null>((acc, s) => {
    if (s.end === null) return "läuft";
    return acc === "läuft" ? acc : acc === null || s.end > acc ? s.end : acc;
  }, null);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Tagesverlauf</h1>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>

      <DayPicker
        dateKey={dateKey}
        prevKey={prevKey}
        nextKey={nextKey}
        todayKey={todayKey}
        weekDays={weekDays}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Gesamt</p>
          <p className="text-lg font-semibold">
            {data.totalMinutes > 0 ? formatMinutes(data.totalMinutes) : "—"}
          </p>
        </div>
        <div className="rounded-lg border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Erster Start</p>
          <p className="text-lg font-semibold">{first ? first.start : "—"}</p>
        </div>
        <div className="rounded-lg border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Letztes Ende</p>
          <p className="text-lg font-semibold">{last ?? "—"}</p>
        </div>
      </div>

      <section className="rounded-lg border bg-card p-4">
        <h2 className="font-medium mb-3">Verteilung nach Stunde</h2>
        <DayHourChart data={data} />
      </section>

      <section>
        <h2 className="font-medium mb-3">Einträge</h2>
        {data.sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Zeiteinträge an diesem Tag.</p>
        ) : (
          <div className="grid gap-2">
            {data.sessions.map((s) => (
              <div
                key={s.id}
                className="rounded-lg border bg-card px-4 py-3 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.taskName}</p>
                  <p className="text-xs text-muted-foreground">{s.projectName}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm tabular-nums">
                    {s.start}–{s.end ?? "läuft"}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatMinutes(s.minutes)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
