"use client";

export function LogTime({ iso }: { iso: string }) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const time = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

  if (d.toDateString() === today.toDateString()) return <>{`Heute, ${time}`}</>;
  if (d.toDateString() === yesterday.toDateString()) return <>{`Gestern, ${time}`}</>;

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return <>{`${day}.${month}., ${time}`}</>;
}
