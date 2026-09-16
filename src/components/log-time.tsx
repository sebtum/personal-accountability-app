"use client";

/**
 * Renders a log timestamp in the browser's local timezone. Client-only on
 * purpose — the server's timezone must never decide what "Heute" means.
 *
 * With `endIso` it renders a range: "Heute, 09:00 – 12:30".
 */
export function LogTime({ iso, endIso }: { iso: string; endIso?: string }) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const time = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  const range = endIso
    ? `${time} – ${new Date(endIso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`
    : time;

  if (d.toDateString() === today.toDateString()) return <>{`Heute, ${range}`}</>;
  if (d.toDateString() === yesterday.toDateString()) return <>{`Gestern, ${range}`}</>;

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return <>{`${day}.${month}., ${range}`}</>;
}
