"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, CalendarClock, FileText, Star, Video, XCircle } from "lucide-react";
import { familyIds, notify, useStore } from "@/lib/store";
import { fmt12, fmtDate, relDay, todayStr } from "@/lib/time";
import type { Appointment } from "@/lib/types";
import { Avatar, Button, Card, Empty, Modal, StatusBadge, Stars, cx, inputCls, money } from "@/components/ui";
import { PageTitle } from "@/components/Shell";

export default function Appointments() {
  const { state, update } = useStore();
  const fam = familyIds(state);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [cancel, setCancel] = useState<Appointment | null>(null);
  const [reason, setReason] = useState("Feeling better");
  const [rate, setRate] = useState<Appointment | null>(null);
  const [stars, setStars] = useState(5);
  const [review, setReview] = useState("");
  const today = todayStr();

  const all = state.appointments.filter((a) => fam.includes(a.patientId));
  const upcoming = all
    .filter((a) => a.date >= today && ["booked", "checked-in", "in-consult"].includes(a.status))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const past = all
    .filter((a) => !upcoming.includes(a))
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const list = tab === "upcoming" ? upcoming : past;

  return (
    <div>
      <PageTitle title="My visits" sub="Your family's appointments with Dr. Ananya Mehta" action={<Link href="/patient/book"><Button>Book new</Button></Link>} />
      <div className="mb-4 inline-flex rounded-xl bg-slate-100 p-1 text-sm font-medium">
        {(["upcoming", "past"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cx("rounded-lg px-4 py-1.5 capitalize", tab === t ? "bg-white shadow-sm" : "text-slate-500")}>
            {t} ({t === "upcoming" ? upcoming.length : past.length})
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {list.length === 0 && <Empty icon={<CalendarClock size={32} />} title={tab === "upcoming" ? "No upcoming visits" : "No past visits"} />}
        {list.map((a) => {
          const p = state.patients.find((x) => x.id === a.patientId)!;
          const rx = state.prescriptions.find((r) => r.appointmentId === a.id);
          return (
            <Card key={a.id} className="p-4">
              <div className="flex items-start gap-3">
                <Avatar name={p.name} size={40} />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{relDay(a.date)} · {fmt12(a.time)}</span>
                    <StatusBadge status={a.status} />
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-slate-500">
                    <span>{p.name}{p.relation ? ` (${p.relation})` : ""}</span>
                    <span className="flex items-center gap-1">{a.mode === "video" ? <Video size={14} /> : <Building2 size={14} />}{a.mode === "video" ? "Video" : "Clinic"}</span>
                    <span>Token #{a.token}</span>
                    <span>{money(a.fee)} {a.paid ? `· paid ${a.payMethod ?? ""}` : "· pay at clinic"}</span>
                  </div>
                  {a.symptoms && <div className="mt-1 text-sm text-slate-600">“{a.symptoms}”</div>}
                  {a.cancelReason && <div className="mt-1 text-xs text-slate-500">Cancelled: {a.cancelReason}</div>}
                  {a.rating && <div className="mt-1 flex items-center gap-2 text-xs text-slate-500"><Stars value={a.rating} size={12} /> {a.review}</div>}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {tab === "upcoming" && a.status !== "in-consult" && (
                  <>
                    <Link href={`/patient/book?reschedule=${a.id}`}><Button size="sm" variant="outline"><CalendarClock size={14} /> Reschedule</Button></Link>
                    <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => setCancel(a)}><XCircle size={14} /> Cancel</Button>
                  </>
                )}
                {a.mode === "video" && a.date === today && tab === "upcoming" && (
                  <Button size="sm" variant="secondary" onClick={() => alert("Demo: the video call opens here (secure in-app video).")}><Video size={14} /> Join video call</Button>
                )}
                {rx && (
                  <Link href={`/prescription/${rx.id}`}><Button size="sm" variant="secondary"><FileText size={14} /> Prescription</Button></Link>
                )}
                {a.status === "done" && !a.rating && (
                  <Button size="sm" variant="outline" onClick={() => setRate(a)}><Star size={14} /> Rate visit</Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={!!cancel} onClose={() => setCancel(null)} title="Cancel appointment?">
        {cancel && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">{fmtDate(cancel.date, { weekday: true })} at {fmt12(cancel.time)}. {cancel.paid ? "Your payment will be refunded in 3–5 days." : ""}</p>
            <select className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)}>
              {["Feeling better", "Not available at this time", "Booked by mistake", "Other"].map((r) => <option key={r}>{r}</option>)}
            </select>
            <Button
              variant="danger"
              className="w-full"
              onClick={() => {
                const p = state.patients.find((x) => x.id === cancel.patientId)!;
                update((d) => {
                  const a = d.appointments.find((x) => x.id === cancel.id)!;
                  a.status = "cancelled";
                  a.cancelReason = reason;
                  notify(d, { to: "doctor", text: `${p.name} cancelled ${fmtDate(cancel.date)} ${fmt12(cancel.time)} — slot reopened` });
                });
                setCancel(null);
              }}
            >
              Cancel appointment
            </Button>
          </div>
        )}
      </Modal>

      <Modal open={!!rate} onClose={() => setRate(null)} title="How was your visit?">
        <div className="space-y-3">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <button key={i} onClick={() => setStars(i)} aria-label={`${i} stars`}>
                <Star size={32} className={i <= stars ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
              </button>
            ))}
          </div>
          <textarea className={cx(inputCls, "min-h-20")} placeholder="Share your experience (optional)" value={review} onChange={(e) => setReview(e.target.value)} />
          <Button
            className="w-full"
            onClick={() => {
              const p = state.patients.find((x) => x.id === rate!.patientId)!;
              update((d) => {
                const a = d.appointments.find((x) => x.id === rate!.id)!;
                a.rating = stars;
                a.review = review;
                d.reviews.unshift({ id: `rv${Date.now()}`, patientName: `${p.name.split(" ")[0]} ${p.name.split(" ")[1]?.[0] ?? ""}.`, rating: stars, text: review || "Great experience.", date: todayStr() });
                notify(d, { to: "doctor", text: `New ${stars}★ review from ${p.name}` });
              });
              setRate(null);
              setReview("");
            }}
          >
            Submit
          </Button>
        </div>
      </Modal>
    </div>
  );
}
