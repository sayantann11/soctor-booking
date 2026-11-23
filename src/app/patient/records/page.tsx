"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FileText, Upload as UploadIcon, Stethoscope, Pill, FlaskConical, ChevronRight } from "lucide-react";
import { familyIds, useStore } from "@/lib/store";
import { fmtDate } from "@/lib/time";
import { Avatar, Badge, Button, Card, cx } from "@/components/ui";
import { PageTitle } from "@/components/Shell";
import { UploadDialog } from "@/components/UploadDialog";
import { UploadList } from "@/components/UploadList";
import { MedicineToday } from "@/components/MedicineToday";

function RecordsInner() {
  const { state } = useStore();
  const params = useSearchParams();
  const fam = familyIds(state);
  const [who, setWho] = useState<string>("all");
  const [upload, setUpload] = useState(false);
  useEffect(() => {
    if (params.get("upload")) setUpload(true);
  }, [params]);

  const ids = who === "all" ? fam : [who];
  const rx = state.prescriptions.filter((r) => ids.includes(r.patientId)).sort((a, b) => b.date.localeCompare(a.date));
  const uploads = state.uploads.filter((u) => ids.includes(u.patientId));
  const visits = state.appointments.filter((a) => ids.includes(a.patientId) && a.status === "done");

  const timeline = [
    ...visits.map((a) => ({ date: a.date, kind: "visit" as const, id: a.id, text: a.symptoms ?? "Consultation", pid: a.patientId })),
    ...rx.map((r) => ({ date: r.date, kind: "rx" as const, id: r.id, text: r.diagnosis, pid: r.patientId })),
    ...uploads.map((u) => ({ date: u.date, kind: "upload" as const, id: u.id, text: u.name, pid: u.patientId })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <PageTitle title="Health records" sub="Prescriptions, reports and visit history in one place" action={<Button onClick={() => setUpload(true)}><UploadIcon size={16} /> Upload</Button>} />

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1">
        <button onClick={() => setWho("all")} className={cx("rounded-full border px-3 py-1.5 text-sm", who === "all" ? "border-brand-600 bg-brand-50 text-brand-800" : "border-slate-200 bg-white")}>Whole family</button>
        {fam.map((id) => {
          const p = state.patients.find((x) => x.id === id)!;
          return (
            <button key={id} onClick={() => setWho(id)} className={cx("flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm", who === id ? "border-brand-600 bg-brand-50 text-brand-800" : "border-slate-200 bg-white")}>
              <Avatar name={p.name} size={20} /> {p.name.split(" ")[0]}
            </button>
          );
        })}
      </div>

      <section>
        <h2 className="mb-2 font-semibold">Prescriptions</h2>
        {rx.length === 0 ? (
          <Card className="p-4 text-sm text-slate-500">No prescriptions yet.</Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {rx.map((r) => {
              const p = state.patients.find((x) => x.id === r.patientId)!;
              return (
                <Link key={r.id} href={`/prescription/${r.id}`}>
                  <Card className="p-4 hover:border-brand-200">
                    <div className="flex items-center justify-between">
                      <Badge tone="teal"><FileText size={12} /> Rx · {fmtDate(r.date)}</Badge>
                      <ChevronRight size={18} className="text-slate-400" />
                    </div>
                    <div className="mt-2 font-semibold">{r.diagnosis}</div>
                    <div className="text-sm text-slate-500">{p.name} · {r.medicines.length} medicines{r.tests.length ? ` · ${r.tests.length} tests` : ""}</div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Uploaded reports & old prescriptions</h2>
        <UploadList uploads={uploads} canDelete showWho={who === "all"} />
      </section>

      <MedicineToday />

      <section>
        <h2 className="mb-2 font-semibold">Health timeline</h2>
        <Card className="p-4">
          <ol className="relative space-y-4 border-l border-slate-200 pl-5">
            {timeline.slice(0, 15).map((t) => {
              const Icon = t.kind === "visit" ? Stethoscope : t.kind === "rx" ? Pill : FlaskConical;
              return (
                <li key={t.kind + t.id} className="relative">
                  <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-brand-700 ring-4 ring-white"><Icon size={13} /></span>
                  <div className="text-xs text-slate-500">{fmtDate(t.date)} · {state.patients.find((p) => p.id === t.pid)?.name.split(" ")[0]}</div>
                  <div className="text-sm">{t.kind === "visit" ? "Visit: " : t.kind === "rx" ? "Prescription: " : "Uploaded: "}{t.text}</div>
                </li>
              );
            })}
          </ol>
        </Card>
      </section>

      <UploadDialog open={upload} onClose={() => setUpload(false)} defaultPatientId={who === "all" ? undefined : who} />
    </div>
  );
}

export default function Records() {
  return (
    <Suspense>
      <RecordsInner />
    </Suspense>
  );
}
