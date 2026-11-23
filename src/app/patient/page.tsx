"use client";

import Link from "next/link";
import { CalendarPlus, FileUp, Pill, RefreshCw, ChevronRight, Video, Building2 } from "lucide-react";
import { familyIds, useStore } from "@/lib/store";
import { LiveQueueCard } from "@/components/LiveQueueCard";
import { Card, StatusBadge, Avatar } from "@/components/ui";
import { fmt12, relDay, todayStr } from "@/lib/time";
import { DOCTOR } from "@/lib/doctor";
import { MedicineToday } from "@/components/MedicineToday";

export default function PatientHome() {
  const { state } = useStore();
  const me = state.patients.find((p) => p.id === state.currentPatientId)!;
  const fam = familyIds(state);
  const today = todayStr();
  const mine = state.appointments
    .filter((a) => fam.includes(a.patientId) && a.date >= today && !["cancelled", "done", "no-show"].includes(a.status))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const todays = mine.filter((a) => a.date === today);
  const later = mine.filter((a) => a.date !== today);
  const followUps = state.prescriptions.filter(
    (rx) =>
      fam.includes(rx.patientId) &&
      rx.followUpDate &&
      rx.followUpDate <= today &&
      !state.appointments.some((a) => a.patientId === rx.patientId && a.date >= rx.followUpDate! && a.status !== "cancelled"),
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Good to see you,</p>
        <h1 className="text-2xl font-semibold tracking-tight">{me.name.split(" ")[0]} 👋</h1>
      </div>

      {todays.map((a) => (
        <LiveQueueCard key={a.id} appt={a} />
      ))}

      <div className="grid grid-cols-3 gap-3">
        {[
          { href: "/patient/book", icon: CalendarPlus, label: "Book visit" },
          { href: "/patient/records?upload=1", icon: FileUp, label: "Upload report" },
          { href: "/patient/records#medicines", icon: Pill, label: "Medicines" },
        ].map((x) => (
          <Link key={x.href} href={x.href} className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-center text-sm font-medium shadow-sm hover:border-brand-200 hover:bg-brand-50">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><x.icon size={20} /></div>
            {x.label}
          </Link>
        ))}
      </div>

      {followUps.map((rx) => {
        const p = state.patients.find((x) => x.id === rx.patientId)!;
        return (
          <Card key={rx.id} className="flex items-center gap-3 border-amber-200 bg-amber-50 p-4">
            <RefreshCw className="shrink-0 text-amber-700" size={20} />
            <div className="flex-1 text-sm">
              <b>Follow-up due</b> for {p.name}: {rx.diagnosis}. Book a quick review.
            </div>
            <Link href={`/patient/book?for=${p.id}&type=followup`} className="rounded-xl bg-amber-600 px-3 py-2 text-sm font-medium text-white">Book</Link>
          </Card>
        );
      })}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Upcoming visits</h2>
          <Link href="/patient/appointments" className="text-sm text-brand-700">See all</Link>
        </div>
        {later.length === 0 && todays.length === 0 ? (
          <Card className="p-5 text-sm text-slate-500">No upcoming visits. <Link href="/patient/book" className="text-brand-700">Book one</Link></Card>
        ) : (
          <div className="space-y-2">
            {later.slice(0, 3).map((a) => {
              const p = state.patients.find((x) => x.id === a.patientId)!;
              return (
                <Link key={a.id} href="/patient/appointments">
                  <Card className="flex items-center gap-3 p-4 hover:border-brand-200">
                    <Avatar name={p.name} size={40} />
                    <div className="flex-1">
                      <div className="font-medium">{relDay(a.date)}, {fmt12(a.time)}</div>
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        {a.mode === "video" ? <Video size={14} /> : <Building2 size={14} />} {p.name} · Token #{a.token}
                      </div>
                    </div>
                    <StatusBadge status={a.status} />
                    <ChevronRight size={18} className="text-slate-400" />
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <MedicineToday compact />

      <Card className="flex items-center gap-4 p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-700 font-bold text-white">{DOCTOR.initials}</div>
        <div className="flex-1">
          <div className="font-semibold">{DOCTOR.name}</div>
          <div className="text-sm text-slate-500">{DOCTOR.title} · {DOCTOR.clinic}</div>
        </div>
        <Link href="/" className="text-sm text-brand-700">Profile</Link>
      </Card>
    </div>
  );
}
