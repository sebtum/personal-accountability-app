"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type WeekDay = { key: string; label: string; selected: boolean; future: boolean };

type Props = {
  dateKey: string;
  prevKey: string;
  nextKey: string | null; // null → already at today
  todayKey: string;
  weekDays: WeekDay[];
};

const href = (key: string, todayKey: string) =>
  key === todayKey ? "/tagesverlauf" : `/tagesverlauf?date=${key}`;

export function DayPicker({ dateKey, prevKey, nextKey, todayKey, weekDays }: Props) {
  const router = useRouter();
  const btnCls = buttonVariants({ variant: "outline", size: "sm" });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={href(prevKey, todayKey)} className={btnCls} aria-label="Vorheriger Tag">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <input
          type="date"
          value={dateKey}
          max={todayKey}
          onChange={(e) => {
            if (e.target.value) router.push(href(e.target.value, todayKey));
          }}
          className="h-8 rounded-md border bg-background px-2 text-sm"
        />
        {nextKey ? (
          <Link href={href(nextKey, todayKey)} className={btnCls} aria-label="Nächster Tag">
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className={cn(btnCls, "opacity-50 pointer-events-none")}>
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
        {dateKey !== todayKey && (
          <Link href="/tagesverlauf" className={btnCls}>
            Heute
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {weekDays.map((d) =>
          d.future ? (
            <span
              key={d.key}
              className={cn(btnCls, "opacity-40 pointer-events-none")}
            >
              {d.label}
            </span>
          ) : (
            <Link
              key={d.key}
              href={href(d.key, todayKey)}
              className={buttonVariants({ variant: d.selected ? "default" : "outline", size: "sm" })}
            >
              {d.label}
            </Link>
          )
        )}
      </div>
    </div>
  );
}
