"use client";

import { Check, Moon, Sun, Sunrise } from "lucide-react";
import { familyIds, useStore } from "@/lib/store";
import { addDays, todayStr } from "@/lib/time";
import { Card, cx } from "./ui";

const SLOTS = [
  { key: "morning", label: "Morning", icon: Sunrise },
  { key: "afternoon", label: "Afternoon", icon: Sun },
  { key: "night", label: "Night", icon: Moon },
] as const;

export function MedicineToday({ compact }: { compact?: boolean }) {
  const { state, update } = useStore();
  const fam = familyIds(state);
  const today = todayStr();
  const active = state.prescriptions.filter((rx) => fam.includes(rx.patientId));

  const items: { key: string; rxId: string; who: string; med: string; info: string; slot: (typeof SLOTS)[number] }[] = [];
  active.forEach((rx) => {
    const who = state.patients.find((p) => p.id === rx.patientId)?.name.split(" ")[0] ?? "";
    rx.medicines.forEach((m, i) => {
      if (addDays(rx.date, m.days) < today) return;
      const parts = m.frequency.split("-");
      if (parts.length !== 3) {
        if (m.frequency === "weekly" && new Date().getDay() !== 0) return;
        items.push({ key: `${rx.id}|${today}|${i}|morning`, rxId: rx.id, who, med: m.name, info: `${m.dose} · ${m.instructions ?? ""}`, slot: SLOTS[0] });
        return;
      }
      parts.forEach((p, si) => {
        if (p !== "0") items.push({ key: `${rx.id}|${today}|${i}|${SLOTS[si].key}`, rxId: rx.id, who, med: m.name, info: `${m.dose} · ${m.instructions ?? ""}`, slot: SLOTS[si] });
      });
    });
  });

  const taken = items.filter((x) => state.doseLog[x.key]).length;

  return (
    <section id="medicines">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold">Today&apos;s medicines</h2>
        {items.length > 0 && <span className="text-sm text-slate-500">{taken}/{items.length} taken</span>}
      </div>
      <Card className="divide-y divide-slate-100">
        {items.length === 0 && <div className="p-4 text-sm text-slate-500">No active medicines. Reminders appear here when the doctor prescribes them.</div>}
        {(compact ? items.slice(0, 4) : items).map((x) => {
          const done = !!state.doseLog[x.key];
          return (
            <button
              key={x.key}
              onClick={() => update((d) => { d.doseLog[x.key] = !done; })}
              className="flex w-full items-center gap-3 p-3 text-left hover:bg-slate-50"
            >
              <x.slot.icon size={18} className="shrink-0 text-amber-500" />
              <div className="flex-1">
                <div className={cx("text-sm font-medium", done && "text-slate-400 line-through")}>{x.med}</div>
                <div className="text-xs text-slate-500">{x.slot.label} · {x.who} · {x.info}</div>
              </div>
              <span className={cx("flex h-6 w-6 items-center justify-center rounded-full border", done ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300")}>
                {done && <Check size={14} />}
              </span>
            </button>
          );
        })}
        {compact && items.length > 4 && (
          <a href="/patient/records#medicines" className="block p-3 text-center text-sm text-brand-700">+{items.length - 4} more</a>
        )}
      </Card>
    </section>
  );
}
