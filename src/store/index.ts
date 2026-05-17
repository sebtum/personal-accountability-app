import { create } from "zustand";

type TimerSlice = {
  activeTaskId: string | null;
  timerStartedAt: Date | null;
  startTimer: (taskId: string) => void;
  stopTimer: () => void;
};

export const useTimerStore = create<TimerSlice>((set) => ({
  activeTaskId: null,
  timerStartedAt: null,
  startTimer: (taskId) =>
    set({ activeTaskId: taskId, timerStartedAt: new Date() }),
  stopTimer: () => set({ activeTaskId: null, timerStartedAt: null }),
}));
