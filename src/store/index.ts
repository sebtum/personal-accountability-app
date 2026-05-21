import { create } from "zustand";

type TimerSlice = {
  activeTaskId: string | null;
  activeLogId: string | null;
  timerStartedAt: Date | null;
  startTimer: (taskId: string, logId: string) => void;
  stopTimer: () => void;
};

export const useTimerStore = create<TimerSlice>((set) => ({
  activeTaskId: null,
  activeLogId: null,
  timerStartedAt: null,
  startTimer: (taskId, logId) =>
    set({ activeTaskId: taskId, activeLogId: logId, timerStartedAt: new Date() }),
  stopTimer: () =>
    set({ activeTaskId: null, activeLogId: null, timerStartedAt: null }),
}));
