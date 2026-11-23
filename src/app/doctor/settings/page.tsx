"use client";

import { useState } from "react";
import { CalendarOff, Plus, Trash2 } from "lucide-react";
import { notify, useStore } from "@/lib/store";
import { addDays, fmtDate, fmt12, todayStr } from "@/lib/time";
import { Button, Card, Field, inputCls, money } from "@/components/ui";
import { PageTitle } from "@/components/Shell";

export default function Settings() {
  const { state, update } = useStore();
  const s = state.settings;
  const [leave, setLeave] = useState(addDays(todayStr(), 14));
  const [saved, setSaved] = useState(false);
  const flash = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="space-y-6">
      <PageTitle title="Availability & settings" sub="Changes show up on the patient app immediately" action={saved ? <span className="text-sm text-emerald-700">Saved ✓</span> : null} />

      <Card className="space-y-4 p-5">
        <h2 className="font-semibold">Working hours (Mon–Sat)</h2>
        {s.sessions.map((sess, i) => (
          <div key={i} className="flex flex-wrap items-end gap-3">
            <span className="w-20 pb-2 text-sm font-medium">{i === 0 ? "Morning" : "Evening"}</span>
            <Field label="From">
              <input type="time" className={inputCls} value={sess.start} onChange={(e) => { update((d) => { d.settings.sessions[i].start = e.target.value; }); flash(); }} />
            </Field>
            <Field label="To">
              <input type="time" className={inputCls} value={sess.end} onChange={(e) => { update((d) => { d.settings.sessions[i].end = e.target.value; }); flash(); }} />
            </Field>
            <span className="pb-2 text-sm text-slate-500">{fmt12(sess.start)} – {fmt12(sess.end)}</span>
          </div>
        ))}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Slot length" hint="Wait-time prediction uses your real average, not just this">
            <select className={inputCls} value={s.slotMins} onChange={(e) => { update((d) => { d.settings.slotMins = Number(e.target.value); }); flash(); }}>
              {[10, 15, 20, 30].map((m) => <option key={m} value={m}>{m} minutes</option>)}
            </select>
          </Field>
          <Field label="Max patients per day">
            <input type="number" className={inputCls} value={s.maxPerDay} onChange={(e) => { update((d) => { d.settings.maxPerDay = Number(e.target.value); }); flash(); }} />
          </Field>
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="font-semibold">Consultation fees</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {(
            [
              ["fee", "New patient (clinic)"],
              ["followupFee", "Follow-up (clinic)"],
              ["videoFee", "Video consult"],
            ] as const
          ).map(([k, label]) => (
            <Field key={k} label={label} hint={money(s[k])}>
              <input type="number" className={inputCls} value={s[k]} onChange={(e) => { update((d) => { d.settings[k] = Number(e.target.value); }); flash(); }} />
            </Field>
          ))}
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="flex items-center gap-2 font-semibold"><CalendarOff size={18} /> Leave & holidays</h2>
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Block a date"><input type="date" className={inputCls} value={leave} min={todayStr()} onChange={(e) => setLeave(e.target.value)} /></Field>
          <Button
            onClick={() => {
              update((d) => {
                if (!d.settings.leaves.includes(leave)) d.settings.leaves.push(leave);
                d.settings.leaves.sort();
                const affected = d.appointments.filter((a) => a.date === leave && a.status === "booked");
                affected.forEach((a) => {
                  a.status = "cancelled";
                  a.cancelReason = "Doctor on leave";
                  notify(d, { to: "patient", patientId: a.patientId, text: `Dr. Ananya Mehta is on leave on ${fmtDate(leave)}. Your appointment was cancelled — please rebook. Any payment will be refunded.` });
                });
              });
              flash();
            }}
          >
            <Plus size={16} /> Add leave
          </Button>
        </div>
        <p className="text-xs text-slate-500">Patients already booked on that day are notified automatically and refunded.</p>
        <div className="space-y-2">
          {s.leaves.map((l) => (
            <div key={l} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm">
              {fmtDate(l, { weekday: true })}
              <button onClick={() => update((d) => { d.settings.leaves = d.settings.leaves.filter((x) => x !== l); })} className="text-slate-400 hover:text-rose-600" aria-label="Remove"><Trash2 size={16} /></button>
            </div>
          ))}
          {s.leaves.length === 0 && <div className="text-sm text-slate-500">No leave planned.</div>}
        </div>
      </Card>
    </div>
  );
}
