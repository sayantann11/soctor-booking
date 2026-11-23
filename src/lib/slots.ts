import type { AppState } from "./types";
import { fromMins, parseDate, toMins, todayStr } from "./time";

export interface Slot {
  time: string;
  session: "Morning" | "Evening";
  taken: boolean;
  past: boolean;
}

export function isClosed(state: AppState, date: string): "leave" | "sunday" | null {
  if (state.settings.leaves.includes(date)) return "leave";
  if (parseDate(date).getDay() === 0) return "sunday";
  return null;
}

export function slotsFor(state: AppState, date: string, ignoreApptId?: string): Slot[] {
  if (isClosed(state, date)) return [];
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const isToday = date === todayStr();
  const taken = new Set(
    state.appointments
      .filter((a) => a.date === date && a.status !== "cancelled" && a.id !== ignoreApptId)
      .map((a) => a.time),
  );
  const out: Slot[] = [];
  state.settings.sessions.forEach((s, i) => {
    for (let m = toMins(s.start); m + state.settings.slotMins <= toMins(s.end); m += state.settings.slotMins) {
      const time = fromMins(m);
      out.push({
        time,
        session: i === 0 ? "Morning" : "Evening",
        taken: taken.has(time),
        past: isToday && m <= nowMins + 10,
      });
    }
  });
  return out;
}

export function bookedCount(state: AppState, date: string) {
  return state.appointments.filter((a) => a.date === date && a.status !== "cancelled").length;
}
