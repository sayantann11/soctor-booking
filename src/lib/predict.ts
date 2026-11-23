import type { AppState, Appointment, VisitType } from "./types";
import { slotToMs, todayStr } from "./time";

export interface ConsultStats {
  avgNew: number;
  avgFollowup: number;
  avgAll: number;
  sampleSize: number;
  spread: number; // typical +/- minutes per patient
}

/** Learn the doctor's real consult time from completed visits (last 30 days). */
export function consultStats(state: AppState): ConsultStats {
  const done = state.appointments.filter((a) => a.status === "done" && a.consultMins);
  const by = (t: VisitType) => done.filter((a) => a.type === t).map((a) => a.consultMins!);
  const avg = (xs: number[], fallback: number) =>
    xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : fallback;
  const all = done.map((a) => a.consultMins!);
  const mean = avg(all, 10);
  const variance = all.length ? all.reduce((s, x) => s + (x - mean) ** 2, 0) / all.length : 9;
  return {
    avgNew: Math.round(avg(by("new"), 14) * 10) / 10,
    avgFollowup: Math.round(avg(by("followup"), 9) * 10) / 10,
    avgAll: Math.round(mean * 10) / 10,
    sampleSize: all.length,
    spread: Math.sqrt(variance),
  };
}

export interface QueueEntry {
  appt: Appointment;
  position: number; // 1 = next in line
  etaMs: number;
  delayMins: number; // eta vs booked slot
  plusMinus: number;
}

export interface QueueInfo {
  current?: Appointment;
  currentElapsedMins: number;
  currentRemainingMins: number;
  waiting: QueueEntry[];
  done: number;
  noShow: number;
  total: number;
  stats: ConsultStats;
  runningLateMins: number;
}

const ACTIVE: Appointment["status"][] = ["booked", "checked-in"];

/**
 * Predict when each waiting patient will be seen.
 * eta = now + remaining time of current consult + sum(expected time of everyone ahead),
 * never earlier than the patient's booked slot, plus any delay the doctor broadcast.
 */
export function queueInfo(state: AppState, now: number = Date.now(), date = todayStr()): QueueInfo {
  const stats = consultStats(state);
  const list = state.appointments
    .filter((a) => a.date === date && a.status !== "cancelled")
    .sort((a, b) => a.token - b.token);
  const current = list.find((a) => a.status === "in-consult");
  const expected = (a: Appointment) => (a.type === "new" ? stats.avgNew : stats.avgFollowup);

  let elapsed = 0;
  let remaining = 0;
  if (current?.startedAt) {
    elapsed = (now - current.startedAt) / 60000;
    remaining = Math.max(1, expected(current) - elapsed);
  }

  const delay = state.settings.delayMins || 0;
  let t = now + remaining * 60000 + delay * 60000;
  const waiting: QueueEntry[] = [];
  list
    .filter((a) => ACTIVE.includes(a.status))
    .forEach((a, i) => {
      const slot = slotToMs(a.date, a.time);
      t = Math.max(t, slot);
      waiting.push({
        appt: a,
        position: i + 1,
        etaMs: t,
        delayMins: Math.round((t - slot) / 60000),
        plusMinus: Math.max(2, Math.round(stats.spread * Math.sqrt(i + 1) * 0.8)),
      });
      t += expected(a) * 60000;
    });

  const doneCount = list.filter((a) => a.status === "done").length;
  const runningLate = waiting.length ? Math.max(0, waiting[0].delayMins) : 0;
  return {
    current,
    currentElapsedMins: elapsed,
    currentRemainingMins: remaining,
    waiting,
    done: doneCount,
    noShow: list.filter((a) => a.status === "no-show").length,
    total: list.length,
    stats,
    runningLateMins: runningLate,
  };
}

/** For a future booking: predicted wait at the clinic for a chosen slot. */
export function predictWaitForSlot(state: AppState, date: string, time: string): number {
  const stats = consultStats(state);
  const before = state.appointments.filter(
    (a) => a.date === date && a.status !== "cancelled" && a.time < time,
  ).length;
  // historically ~ how far behind the clinic runs per patient ahead
  const drift = Math.max(0, stats.avgAll - state.settings.slotMins) * Math.min(before, 8);
  return Math.round(Math.max(3, drift + 4));
}
