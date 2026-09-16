import { getDashboardStats, getWeeklyHours, getDailyHours, getHourlyDistribution } from "@/lib/data/dashboard";
import { TaskTimerButton } from "@/components/timer/task-timer-button";
import { ChartSection } from "@/components/dashboard/chart-section";
import { StatCard } from "@/components/dashboard/stat-card";
import { RunningTimerCard } from "@/components/dashboard/running-timer-card";
import { ActivityBlockCard } from "@/components/dashboard/activity-block-card";
import { formatMinutes } from "@/lib/utils";

export default async function DashboardPage() {
  const [stats, weeklyHours, dailyHours, hourlyHours] = await Promise.all([
    getDashboardStats(),
    getWeeklyHours(),
    getDailyHours(),
    getHourlyDistribution(7),
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
        <RunningTimerCard />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <section>
          <h2 className="font-medium mb-3">Zuletzt bearbeitet</h2>
          {stats.recentTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Tasks vorhanden.</p>
          ) : (
            <div className="grid gap-2">
              {stats.recentTasks.map((task) => (
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
          {stats.activityBlocks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Zeiteinträge.</p>
          ) : (
            <div className="grid gap-2">
              {stats.activityBlocks.map((block) => (
                <ActivityBlockCard key={block.id} block={block} />
              ))}
            </div>
          )}
        </section>
      </div>

      <ChartSection weeklyData={weeklyHours} dailyData={dailyHours} hourlyData={hourlyHours} />
    </div>
  );
}
