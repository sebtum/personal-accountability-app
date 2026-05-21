import { getOrphanedTimer } from "@/lib/data/time-logs";
import { OrphanedTimerModal } from "./orphaned-timer-modal";

export async function OrphanedTimerChecker() {
  const timer = await getOrphanedTimer();
  if (!timer) return null;
  return <OrphanedTimerModal timer={timer} />;
}
