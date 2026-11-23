"use client";

import { useState } from "react";
import { Bell, Car, Globe, ShieldCheck } from "lucide-react";
import { familyIds, useStore } from "@/lib/store";
import { Avatar, Badge, Card, Field, inputCls } from "@/components/ui";
import { PageTitle } from "@/components/Shell";

export default function Profile() {
  const { state, update } = useStore();
  const fam = familyIds(state);
  const me = state.patients.find((p) => p.id === state.currentPatientId)!;
  const [lang, setLang] = useState("English");
  const [prefs, setPrefs] = useState({ whatsapp: true, sms: true, delay: true, meds: true });

  return (
    <div className="space-y-6">
      <PageTitle title="Profile" sub={me.phone} />

      <section>
        <h2 className="mb-2 font-semibold">Family members</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {fam.map((id) => {
            const p = state.patients.find((x) => x.id === id)!;
            return (
              <Card key={id} className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={p.name} size={44} />
                  <div>
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-sm text-slate-500">{p.relation ?? "Me"} · {p.age}y · {p.gender} · {p.bloodGroup ?? "—"}</div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.allergies.map((a) => <Badge key={a} tone="red">Allergy: {a}</Badge>)}
                  {p.conditions.map((c) => <Badge key={c} tone="amber">{c}</Badge>)}
                  {!p.allergies.length && !p.conditions.length && <span className="text-xs text-slate-400">No conditions recorded</span>}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <Card className="space-y-4 p-5">
        <h2 className="font-semibold">Preferences</h2>
        <Field label="Travel time to clinic (minutes)" hint="Used to tell you when to leave home">
          <div className="flex items-center gap-2">
            <Car size={18} className="text-slate-400" />
            <input
              type="number"
              className={inputCls}
              value={me.travelMins ?? 20}
              onChange={(e) =>
                update((d) => {
                  d.patients.forEach((p) => {
                    if (p.id === me.id || p.familyOf === me.id) p.travelMins = Number(e.target.value) || 0;
                  });
                })
              }
            />
          </div>
        </Field>
        <Field label="Language">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-slate-400" />
            <select className={inputCls} value={lang} onChange={(e) => setLang(e.target.value)}>
              <option>English</option><option>हिन्दी (Hindi)</option><option>मराठी (Marathi)</option>
            </select>
          </div>
        </Field>
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700"><Bell size={16} /> Reminders</div>
          {(
            [
              ["whatsapp", "WhatsApp reminders 24 h and 1 h before"],
              ["sms", "SMS reminders"],
              ["delay", "Alert me if the doctor is running late"],
              ["meds", "Daily medicine reminders"],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="flex items-center justify-between border-b border-slate-100 py-2.5 text-sm last:border-0">
              {label}
              <input type="checkbox" className="h-5 w-5 accent-teal-700" checked={prefs[k]} onChange={(e) => setPrefs({ ...prefs, [k]: e.target.checked })} />
            </label>
          ))}
        </div>
      </Card>

      <Card className="flex items-start gap-3 p-4 text-sm text-slate-600">
        <ShieldCheck className="shrink-0 text-brand-700" size={20} />
        Your records are private to you and Dr. Ananya Mehta&apos;s clinic. You can download or delete your data at any time.
      </Card>
    </div>
  );
}
