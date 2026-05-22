import { getDashboardStats, getWeeklyHours } from "@/lib/data/dashboard";
import { TaskTimerButton } from "@/components/timer/task-timer-button";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

function formatLogTime(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const time = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

  if (d.toDateString() === today.toDateString()) return `Heute, ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Gestern, ${time}`;

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}., ${time}`;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card px-4 py-5">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const [stats, weeklyHours] = await Promise.all([
    getDashboardStats(),
    getWeeklyHours(),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Übersicht</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Aktive Projekte" value={String(stats.activeProjects)} />
        <StatCard label="Offene Tasks" value={String(stats.openTasks)} />
        <StatCard
          label="Heute erfasst"
          value={stats.todayMinutes > 0 ? formatMinutes(stats.todayMinutes) : "—"}
        />
        <StatCard label="In Bearbeitung" value={String(stats.inProgressTasks.length)} />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <section>
          <h2 className="font-medium mb-3">In Bearbeitung</h2>
          {stats.inProgressTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Tasks in Bearbeitung.</p>
          ) : (
            <div className="grid gap-2">
              {stats.inProgressTasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-lg border bg-card px-4 py-3 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{task.name}</p>
                    <p className="text-xs text-muted-foreground">{task.project_name}</p>
                  </div>
                  <TaskTimerButton taskId={task.id} projectId={task.project_id} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-medium mb-3">Letzte Aktivität</h2>
          {stats.recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Zeiteinträge.</p>
          ) : (
            <div className="grid gap-2">
              {stats.recentLogs.map((log) => (
                <div key={log.id} className="rounded-lg border bg-card px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{log.task_name}</p>
                      <p className="text-xs text-muted-foreground">{log.project_name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold tabular-nums">
                        {formatMinutes(log.duration_minutes)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatLogTime(log.started_at)}
                        {log.is_manual && " · manuell"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section>
        <h2 className="font-medium mb-3">Stunden pro Woche</h2>
        <div className="rounded-lg border bg-card p-4">
          <WeeklyChart data={weeklyHours} />
        </div>
      </section>
    </div>
  );
}
