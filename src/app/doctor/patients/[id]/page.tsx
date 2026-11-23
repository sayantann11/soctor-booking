"use client";

import { use } from "react";
import Link from "next/link";
import { FileText, Phone } from "lucide-react";
import { useStore } from "@/lib/store";
import { fmt12, fmtDate } from "@/lib/time";
import { Avatar, Badge, Card, StatusBadge, Stat, money } from "@/components/ui";
import { UploadList } from "@/components/UploadList";

export default function PatientDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { state } = useStore();
  const p = state.patients.find((x) => x.id === id);
  if (!p) return <div className="text-slate-500">Patient not found.</div>;
  const appts = state.appointments.filter((a) => a.patientId === id).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const rx = state.prescriptions.filter((r) => r.patientId === id).sort((a, b) => b.date.localeCompare(a.date));
  const uploads = state.uploads.filter((u) => u.patientId === id);
  const done = appts.filter((a) => a.status === "done");
  const spent = done.reduce((s, a) => s + a.fee, 0);
  const noShows = appts.filter((a) => a.status === "no-show").length;

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center gap-4 p-5">
        <Avatar name={p.name} size={64} />
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{p.name}</h1>
          <div className="text-sm text-slate-500">{p.age}y · {p.gender} · Blood {p.bloodGroup ?? "—"}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {p.allergies.map((a) => <Badge key={a} tone="red">Allergy: {a}</Badge>)}
            {p.conditions.map((c) => <Badge key={c} tone="amber">{c}</Badge>)}
          </div>
        </div>
        <a href={`tel:${p.phone}`} className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm"><Phone size={16} /> {p.phone}</a>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Visits" value={done.length} />
        <Stat label="No-shows" value={noShows} />
        <Stat label="Total billed" value={money(spent)} />
      </div>

      <section>
        <h2 className="mb-2 font-semibold">Uploaded reports</h2>
        <UploadList uploads={uploads} />
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Prescriptions</h2>
        {rx.length === 0 ? <Card className="p-4 text-sm text-slate-500">None yet.</Card> : (
          <div className="grid gap-2 sm:grid-cols-2">
            {rx.map((r) => (
              <Link key={r.id} href={`/prescription/${r.id}`}>
                <Card className="flex items-center gap-3 p-3 hover:border-brand-200">
                  <FileText size={20} className="text-brand-700" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{r.diagnosis}</div>
                    <div className="text-xs text-slate-500">{fmtDate(r.date)} · {r.medicines.length} medicines</div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Visit history</h2>
        <Card className="divide-y divide-slate-100">
          {appts.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
              <span className="w-36 font-medium">{fmtDate(a.date)} · {fmt12(a.time)}</span>
              <span className="min-w-0 flex-1 truncate text-slate-500">{a.symptoms}</span>
              {a.consultMins && <span className="text-xs text-slate-500">{a.consultMins} min</span>}
              <StatusBadge status={a.status} />
              {(a.status === "in-consult" || a.status === "done") && !state.prescriptions.some((r) => r.appointmentId === a.id) && (
                <Link href={`/doctor/consult/${a.id}`} className="text-brand-700">Write Rx</Link>
              )}
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}
