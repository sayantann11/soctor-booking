"use client";

import Link from "next/link";
import {
  Award,
  CalendarCheck,
  Clock,
  FileUp,
  Languages,
  MapPin,
  Phone,
  ShieldCheck,
  Stethoscope,
  Timer,
  UserRound,
  Video,
  BellRing,
  Pill,
} from "lucide-react";
import { DOCTOR } from "@/lib/doctor";
import { useStore } from "@/lib/store";
import { Avatar, Card, money, Stars } from "@/components/ui";
import { fmt12, shortDate } from "@/lib/time";
import { queueInfo } from "@/lib/predict";

export default function Landing() {
  const { state, ready } = useStore();
  const avg = state.reviews.reduce((s, r) => s + r.rating, 0) / Math.max(1, state.reviews.length);
  const q = ready ? queueInfo(state) : null;

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-amber-100 px-4 py-2 text-center text-xs font-medium text-amber-900">
        Live demo with sample data — no real patient information is stored.
      </div>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white">
            <Stethoscope size={20} />
          </div>
          <div>
            <div className="font-semibold leading-tight">{DOCTOR.clinic}</div>
            <div className="text-xs text-slate-500">Powered by ClinicFlow</div>
          </div>
        </div>
        <Link href="/login?role=doctor" className="text-sm font-medium text-brand-700 hover:underline">
          Doctor login
        </Link>
      </header>

      {/* hero */}
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.4fr_1fr] md:px-8 md:py-16">
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-700 text-2xl font-bold text-white shadow-lg md:h-24 md:w-24">
                {DOCTOR.initials}
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{DOCTOR.name}</h1>
                <p className="text-slate-600">{DOCTOR.title}</p>
                <p className="text-sm text-slate-500">{DOCTOR.degrees}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
              <span className="flex items-center gap-1.5"><Award size={16} className="text-brand-700" /> {DOCTOR.experience} years experience</span>
              <span className="flex items-center gap-1.5"><Stars value={avg} /> {avg.toFixed(1)} ({state.reviews.length + 312} reviews)</span>
              <span className="flex items-center gap-1.5"><Languages size={16} className="text-brand-700" /> {DOCTOR.languages.join(", ")}</span>
            </div>
            <p className="mt-5 max-w-xl text-slate-600">{DOCTOR.about}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/login?role=patient" className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand-700 px-6 font-medium text-white shadow hover:bg-brand-800">
                <CalendarCheck size={18} /> Book appointment
              </Link>
              <Link href="/login?role=doctor" className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 font-medium text-slate-700 hover:bg-slate-50">
                <UserRound size={18} /> Open doctor dashboard
              </Link>
            </div>
          </div>

          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <span className="pulse-dot h-2 w-2 rounded-full bg-emerald-500" /> Clinic live status
            </div>
            {q ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-brand-50 p-3">
                    <div className="text-xs text-brand-800">Now serving</div>
                    <div className="text-2xl font-bold text-brand-900">#{q.current?.token ?? "—"}</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-xs text-slate-600">Waiting</div>
                    <div className="text-2xl font-bold">{q.waiting.length}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm">
                  <Timer size={16} className="text-brand-700" />
                  Avg consult time: <b>{q.stats.avgAll} min</b>
                </div>
              </div>
            ) : (
              <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
            )}
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
              <div className="flex gap-2"><Clock size={16} className="mt-0.5 shrink-0 text-brand-700" /> Mon–Sat · {state.settings.sessions.map((s) => `${fmt12(s.start)}–${fmt12(s.end)}`).join(" & ")}</div>
              <div className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-brand-700" /> {DOCTOR.address}</div>
              <div className="flex gap-2"><Phone size={16} className="mt-0.5 shrink-0 text-brand-700" /> {DOCTOR.phone}</div>
              <div className="flex gap-2"><span className="w-4 shrink-0 text-center font-semibold text-brand-700">₹</span> Clinic visit {money(state.settings.fee)} · Follow-up {money(state.settings.followupFee)} · Video {money(state.settings.videoFee)}</div>
            </div>
          </Card>
        </div>
      </section>

      {/* features */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:px-8">
        <h2 className="text-center text-2xl font-bold">Skip the waiting room</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-slate-500">Book in under a minute, see exactly when you will be called, and keep every report and prescription on your phone.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: CalendarCheck, t: "Instant booking", d: "Pick a free slot for you or a family member. Pay online or at the clinic." },
            { icon: Timer, t: "Wait-time prediction", d: "Live queue position and a predicted time, learned from the doctor's real consult times." },
            { icon: FileUp, t: "Upload reports", d: "Share old prescriptions, lab reports and scans before your visit." },
            { icon: Pill, t: "Digital prescriptions", d: "Download your prescription and get daily medicine reminders." },
            { icon: Video, t: "Video consults", d: "See the doctor online for follow-ups and quick advice." },
            { icon: BellRing, t: "Smart reminders", d: "Reminders before your visit and alerts if the doctor is running late." },
          ].map((f) => (
            <Card key={f.t} className="p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><f.icon size={20} /></div>
              <div className="font-semibold">{f.t}</div>
              <div className="mt-1 text-sm text-slate-500">{f.d}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* services + education */}
      <section className="bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-2 md:px-8">
          <div>
            <h3 className="text-lg font-semibold">Services</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {DOCTOR.services.map((s) => (
                <span key={s} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm">{s}</span>
              ))}
            </div>
            <h3 className="mt-8 text-lg font-semibold">Education</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {DOCTOR.education.map((e) => (
                <li key={e.what} className="flex justify-between gap-4 rounded-xl bg-white p-3">
                  <span><b>{e.what}</b> · {e.where}</span>
                  <span className="text-slate-500">{e.year}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500"><ShieldCheck size={14} /> Reg. no. {DOCTOR.regNo}</div>
          </div>
          <div>
            <h3 className="text-lg font-semibold">What patients say</h3>
            <div className="mt-3 space-y-3">
              {state.reviews.slice(0, 4).map((r) => (
                <Card key={r.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.patientName} size={32} />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{r.patientName}</div>
                      <Stars value={r.rating} size={12} />
                    </div>
                    <div className="text-xs text-slate-400">{shortDate(r.date)}</div>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{r.text}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="px-4 py-8 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} {DOCTOR.clinic} · Demo built with ClinicFlow
      </footer>
    </div>
  );
}
