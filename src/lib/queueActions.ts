import type { AppState } from "./types";
import { notify, nextToken, uid } from "./store";
import { todayStr, fromMins } from "./time";

/** Finish whoever is in consultation (if any) */
export function finishCurrent(d: AppState) {
  const cur = d.appointments.find((a) => a.date === todayStr() && a.status === "in-consult");
  if (!cur) return;
  cur.status = "done";
  cur.endedAt = Date.now();
  cur.consultMins = Math.max(1, Math.round((cur.endedAt - (cur.startedAt ?? cur.endedAt)) / 60000));
  if (!cur.paid) {
    cur.paid = true;
    cur.payMethod = "Clinic";
  }
}

/** Finish current and call the next waiting patient */
export function callNext(d: AppState, specificId?: string) {
  finishCurrent(d);
  const waiting = d.appointments
    .filter((a) => a.date === todayStr() && (a.status === "booked" || a.status === "checked-in"))
    .sort((a, b) => a.token - b.token);
  const next = specificId ? waiting.find((a) => a.id === specificId) : waiting[0];
  if (!next) return;
  next.status = "in-consult";
  next.startedAt = Date.now();
  notify(d, { to: "patient", patientId: next.patientId, text: `Token #${next.token}: it's your turn now. Please go in.` });
  const after = waiting.filter((a) => a.id !== next.id)[0];
  if (after) notify(d, { to: "patient", patientId: after.patientId, text: `Token #${after.token}: you're next. Please be ready.` });
}

export function addWalkIn(d: AppState, name: string, age: number, gender: "Male" | "Female" | "Other", phone: string) {
  const id = uid("p");
  d.patients.push({ id, name, age, gender, phone, allergies: [], conditions: [] });
  const today = todayStr();
  const list = d.appointments.filter((a) => a.date === today);
  const last = list.sort((a, b) => b.token - a.token)[0];
  const [h, m] = (last?.time ?? "10:00").split(":").map(Number);
  d.appointments.push({
    id: uid("a"),
    patientId: id,
    date: today,
    time: fromMins(h * 60 + m + d.settings.slotMins),
    token: nextToken(d, today),
    type: "new",
    mode: "clinic",
    status: "checked-in",
    fee: d.settings.fee,
    paid: false,
    walkIn: true,
    symptoms: "Walk-in",
  });
}
