"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, Wand2, Save, FileText } from "lucide-react";
import { notify, uid, useStore } from "@/lib/store";
import { callNext } from "@/lib/queueActions";
import { MEDICINE_LIBRARY, RX_TEMPLATES } from "@/lib/doctor";
import { addDays, fmtDate, todayStr } from "@/lib/time";
import type { Medicine } from "@/lib/types";
import { Avatar, Badge, Button, Card, Field, cx, inputCls } from "@/components/ui";
import { UploadList } from "@/components/UploadList";

export default function Consult({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { state, update } = useStore();
  const router = useRouter();
  const appt = state.appointments.find((a) => a.id === id);
  const existing = state.prescriptions.find((r) => r.appointmentId === id);

  const [diagnosis, setDiagnosis] = useState(existing?.diagnosis ?? "");
  const [meds, setMeds] = useState<Medicine[]>(existing?.medicines ?? []);
  const [tests, setTests] = useState(existing?.tests.join(", ") ?? "");
  const [advice, setAdvice] = useState(existing?.advice ?? "");
  const [follow, setFollow] = useState<number | null>(7);
  const [vitals, setVitals] = useState(existing?.vitals ?? { bp: "", pulse: "", temp: "", weight: "" });
  const [search, setSearch] = useState("");

  if (!appt) return <div className="text-slate-500">Appointment not found.</div>;
  const p = state.patients.find((x) => x.id === appt.patientId)!;
  const attached = state.uploads.filter((u) => appt.uploadIds?.includes(u.id));
  const otherUploads = state.uploads.filter((u) => u.patientId === p.id && !appt.uploadIds?.includes(u.id));
  const pastRx = state.prescriptions.filter((r) => r.patientId === p.id && r.appointmentId !== id).sort((a, b) => b.date.localeCompare(a.date));
  const matches = search ? MEDICINE_LIBRARY.filter((m) => m.name.toLowerCase().includes(search.toLowerCase())).slice(0, 6) : [];

  const applyTemplate = (name: string) => {
    const t = RX_TEMPLATES.find((x) => x.name === name)!;
    setDiagnosis(t.diagnosis);
    setMeds(t.meds.map((n) => {
      const m = MEDICINE_LIBRARY.find((x) => x.name === n)!;
      return { name: m.name, dose: m.dose, frequency: m.frequency, days: m.days, instructions: m.instructions };
    }));
    setTests(t.tests.join(", "));
    setAdvice(t.advice);
  };

  const save = (andNext: boolean) => {
    update((d) => {
      const rx = {
        id: existing?.id ?? uid("rx"),
        appointmentId: id,
        patientId: p.id,
        date: appt.date,
        diagnosis: diagnosis || "Consultation",
        vitals,
        medicines: meds,
        tests: tests.split(",").map((s) => s.trim()).filter(Boolean),
        advice,
        followUpDate: follow ? addDays(todayStr(), follow) : undefined,
      };
      d.prescriptions = d.prescriptions.filter((r) => r.id !== rx.id);
      d.prescriptions.push(rx);
      notify(d, { to: "patient", patientId: p.id, text: `Your prescription from Dr. Ananya Mehta is ready. Medicine reminders are set.` });
      if (andNext && appt.status === "in-consult") callNext(d);
      else {
        const a = d.appointments.find((x) => x.id === id)!;
        if (a.status === "in-consult") {
          a.status = "done";
          a.endedAt = Date.now();
          a.consultMins = Math.max(1, Math.round((a.endedAt - (a.startedAt ?? a.endedAt)) / 60000));
        }
      }
    });
    router.push("/doctor");
  };

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
      {/* patient side panel */}
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Avatar name={p.name} size={48} />
            <div>
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm text-slate-500">{p.age}y · {p.gender} · {p.bloodGroup ?? "—"} · Token #{appt.token}</div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {p.allergies.map((a) => <Badge key={a} tone="red">Allergy: {a}</Badge>)}
            {p.conditions.map((c) => <Badge key={c} tone="amber">{c}</Badge>)}
          </div>
          {appt.symptoms && <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm"><div className="text-xs text-slate-500">Patient says</div>{appt.symptoms}</div>}
          <Link href={`/doctor/patients/${p.id}`} className="mt-3 block text-sm text-brand-700">Full history →</Link>
        </Card>
        <div>
          <div className="mb-2 text-sm font-semibold">Reports shared for this visit</div>
          <UploadList uploads={attached} />
        </div>
        {otherUploads.length > 0 && (
          <div>
            <div className="mb-2 text-sm font-semibold">Other uploads</div>
            <UploadList uploads={otherUploads} />
          </div>
        )}
        {pastRx.length > 0 && (
          <div>
            <div className="mb-2 text-sm font-semibold">Previous prescriptions</div>
            {pastRx.map((r) => (
              <Card key={r.id} className="mb-2 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{r.diagnosis}</span>
                  <Link href={`/prescription/${r.id}`} className="text-brand-700"><FileText size={16} /></Link>
                </div>
                <div className="text-xs text-slate-500">{fmtDate(r.date)} · {r.medicines.map((m) => m.name.split(" ")[0]).join(", ")}</div>
                <button
                  className="mt-1 text-xs font-medium text-brand-700"
                  onClick={() => {
                    setMeds(r.medicines);
                    setDiagnosis(r.diagnosis);
                  }}
                >
                  Repeat this prescription
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* writer */}
      <Card className="space-y-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-semibold">Prescription</h1>
          <div className="flex flex-wrap items-center gap-1.5">
            <Wand2 size={16} className="text-slate-400" />
            {RX_TEMPLATES.map((t) => (
              <button key={t.name} onClick={() => applyTemplate(t.name)} className="rounded-full border border-slate-200 px-2.5 py-1 text-xs hover:border-brand-400 hover:bg-brand-50">{t.name}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(["bp", "pulse", "temp", "weight"] as const).map((k) => (
            <Field key={k} label={{ bp: "BP", pulse: "Pulse", temp: "Temp", weight: "Weight" }[k]}>
              <input className={inputCls} value={vitals[k] ?? ""} placeholder={{ bp: "120/80", pulse: "72", temp: "98.6 °F", weight: "70 kg" }[k]} onChange={(e) => setVitals({ ...vitals, [k]: e.target.value })} />
            </Field>
          ))}
        </div>

        <Field label="Diagnosis"><input className={inputCls} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="e.g. Acute viral fever" /></Field>

        <div>
          <div className="mb-1 text-sm font-medium text-slate-700">Medicines</div>
          <div className="relative">
            <input className={inputCls} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search medicine to add… (try 'para', 'met')" />
            {matches.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                {matches.map((m) => (
                  <button
                    key={m.name}
                    onClick={() => {
                      setMeds([...meds, { name: m.name, dose: m.dose, frequency: m.frequency, days: m.days, instructions: m.instructions }]);
                      setSearch("");
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    <span>{m.name}</span>
                    <span className="text-xs text-slate-500">{m.frequency} · {m.days}d</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="mt-3 space-y-2">
            {meds.map((m, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-3 2xl:grid-cols-[1.6fr_1fr_0.9fr_0.6fr_1.4fr_auto]">
                <input className={cx(inputCls, "col-span-2 font-medium sm:col-span-3 2xl:col-span-1")} value={m.name} onChange={(e) => setMeds(meds.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                <input className={inputCls} value={m.dose} onChange={(e) => setMeds(meds.map((x, j) => (j === i ? { ...x, dose: e.target.value } : x)))} />
                <select className={inputCls} value={m.frequency} onChange={(e) => setMeds(meds.map((x, j) => (j === i ? { ...x, frequency: e.target.value } : x)))}>
                  {["1-0-0", "0-1-0", "0-0-1", "1-0-1", "1-1-0", "0-1-1", "1-1-1", "weekly", "sip often", "SOS"].map((f) => <option key={f}>{f}</option>)}
                </select>
                <input className={inputCls} type="number" value={m.days} onChange={(e) => setMeds(meds.map((x, j) => (j === i ? { ...x, days: Number(e.target.value) } : x)))} />
                <input className={inputCls} value={m.instructions ?? ""} placeholder="Instructions" onChange={(e) => setMeds(meds.map((x, j) => (j === i ? { ...x, instructions: e.target.value } : x)))} />
                <button onClick={() => setMeds(meds.filter((_, j) => j !== i))} className="flex items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Remove"><Trash2 size={16} /></button>
              </div>
            ))}
            <button onClick={() => setMeds([...meds, { name: "", dose: "1 tab", frequency: "1-0-1", days: 5 }])} className="flex items-center gap-1 text-sm font-medium text-brand-700"><Plus size={16} /> Add custom medicine</button>
          </div>
          {p.allergies.some((a) => meds.some((m) => m.name.toLowerCase().includes(a.toLowerCase().slice(0, 5)))) && (
            <div className="mt-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">Warning: a medicine may conflict with the patient&apos;s allergy ({p.allergies.join(", ")}).</div>
          )}
        </div>

        <Field label="Tests advised" hint="Comma separated"><input className={inputCls} value={tests} onChange={(e) => setTests(e.target.value)} placeholder="CBC, HbA1c" /></Field>
        <Field label="Advice"><textarea className={cx(inputCls, "min-h-20")} value={advice} onChange={(e) => setAdvice(e.target.value)} /></Field>

        <div>
          <div className="mb-1 text-sm font-medium text-slate-700">Follow-up</div>
          <div className="flex flex-wrap gap-2">
            {[null, 3, 7, 15, 30, 90].map((d) => (
              <button key={String(d)} onClick={() => setFollow(d)} className={cx("rounded-xl border px-3 py-1.5 text-sm", follow === d ? "border-brand-600 bg-brand-50 text-brand-800" : "border-slate-200")}>
                {d ? `${d} days` : "None"}
              </button>
            ))}
          </div>
          {follow && <div className="mt-1 text-xs text-slate-500">Patient gets a rebooking reminder on {fmtDate(addDays(todayStr(), follow))}</div>}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
          <Button variant="outline" onClick={() => save(false)}><Save size={16} /> Save & finish</Button>
          {appt.status === "in-consult" && <Button onClick={() => save(true)}>Save & call next</Button>}
        </div>
      </Card>
    </div>
  );
}
