"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, Share2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { DOCTOR } from "@/lib/doctor";
import { fmtDate } from "@/lib/time";
import { Button, Loading } from "@/components/ui";

const FREQ: Record<string, string> = {
  "1-0-0": "Morning",
  "0-1-0": "Afternoon",
  "0-0-1": "Night",
  "1-0-1": "Morning & night",
  "1-1-1": "3 times a day",
  "1-1-0": "Morning & afternoon",
  "0-1-1": "Afternoon & night",
};

export default function PrescriptionView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { state, ready } = useStore();
  const router = useRouter();
  if (!ready) return <Loading />;
  const rx = state.prescriptions.find((r) => r.id === id);
  if (!rx) return <div className="p-10 text-center text-slate-500">Prescription not found.</div>;
  const p = state.patients.find((x) => x.id === rx.patientId)!;

  return (
    <div className="min-h-screen bg-slate-100 py-6 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-4 flex max-w-3xl items-center justify-between px-4">
        <Button variant="ghost" onClick={() => router.back()}><ArrowLeft size={16} /> Back</Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const text = `Prescription from ${DOCTOR.name} for ${p.name} (${fmtDate(rx.date)}): ${rx.medicines.map((m) => `${m.name} ${m.frequency} x ${m.days}d`).join("; ")}`;
              if (navigator.share) navigator.share({ title: "Prescription", text }).catch(() => {});
              else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
            }}
          >
            <Share2 size={16} /> Share
          </Button>
          <Button onClick={() => window.print()}><Printer size={16} /> Download PDF</Button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl bg-white p-6 shadow-sm sm:rounded-2xl sm:p-10 print:shadow-none">
        {/* letterhead */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-brand-700 pb-4">
          <div>
            <div className="text-2xl font-bold text-brand-800">{DOCTOR.name}</div>
            <div className="text-sm text-slate-600">{DOCTOR.degrees}</div>
            <div className="text-sm text-slate-600">{DOCTOR.title}</div>
            <div className="text-xs text-slate-500">Reg. no. {DOCTOR.regNo}</div>
          </div>
          <div className="text-right text-sm text-slate-600">
            <div className="font-semibold">{DOCTOR.clinic}</div>
            <div className="max-w-60 text-xs">{DOCTOR.address}</div>
            <div className="text-xs">{DOCTOR.phone}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 border-b border-slate-200 py-4 text-sm sm:grid-cols-4">
          <div><div className="text-xs text-slate-500">Patient</div><b>{p.name}</b></div>
          <div><div className="text-xs text-slate-500">Age / Sex</div>{p.age} / {p.gender}</div>
          <div><div className="text-xs text-slate-500">Date</div>{fmtDate(rx.date)}</div>
          <div><div className="text-xs text-slate-500">Rx ID</div>{rx.id.toUpperCase()}</div>
        </div>

        {rx.vitals && (
          <div className="flex flex-wrap gap-x-6 gap-y-1 border-b border-slate-200 py-3 text-sm">
            {rx.vitals.bp && <span><span className="text-slate-500">BP</span> {rx.vitals.bp}</span>}
            {rx.vitals.pulse && <span><span className="text-slate-500">Pulse</span> {rx.vitals.pulse}</span>}
            {rx.vitals.temp && <span><span className="text-slate-500">Temp</span> {rx.vitals.temp}</span>}
            {rx.vitals.weight && <span><span className="text-slate-500">Weight</span> {rx.vitals.weight}</span>}
            {p.allergies.length > 0 && <span className="text-rose-700">Allergies: {p.allergies.join(", ")}</span>}
          </div>
        )}

        <div className="py-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Diagnosis</div>
          <div className="mt-1 font-medium">{rx.diagnosis}</div>
        </div>

        <div className="mb-1 text-3xl font-serif font-bold text-brand-800">℞</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
              <th className="py-2 pr-2">#</th>
              <th className="py-2 pr-2">Medicine</th>
              <th className="py-2 pr-2">Dose</th>
              <th className="py-2 pr-2">When</th>
              <th className="py-2">Days</th>
            </tr>
          </thead>
          <tbody>
            {rx.medicines.map((m, i) => (
              <tr key={i} className="border-b border-slate-100 align-top">
                <td className="py-2 pr-2 text-slate-400">{i + 1}</td>
                <td className="py-2 pr-2"><b>{m.name}</b>{m.instructions && <div className="text-xs text-slate-500">{m.instructions}</div>}</td>
                <td className="py-2 pr-2">{m.dose}</td>
                <td className="py-2 pr-2">{m.frequency}<div className="text-xs text-slate-500">{FREQ[m.frequency] ?? ""}</div></td>
                <td className="py-2">{m.days}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {rx.tests.length > 0 && (
          <div className="pt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tests advised</div>
            <div className="mt-1 text-sm">{rx.tests.join(" · ")}</div>
          </div>
        )}
        {rx.advice && (
          <div className="pt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Advice</div>
            <div className="mt-1 text-sm">{rx.advice}</div>
          </div>
        )}
        {rx.followUpDate && (
          <div className="mt-4 rounded-xl bg-brand-50 p-3 text-sm text-brand-900">Follow-up on <b>{fmtDate(rx.followUpDate, { weekday: true })}</b> — book from the app.</div>
        )}

        <div className="mt-10 flex items-end justify-between">
          <div className="text-xs text-slate-400">Digitally generated by ClinicFlow · demo</div>
          <div className="text-center">
            <div className="font-[cursive] text-xl text-brand-800">A. Mehta</div>
            <div className="border-t border-slate-300 pt-1 text-xs text-slate-500">{DOCTOR.name}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
