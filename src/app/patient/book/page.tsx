"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Building2, CalendarCheck, CheckCircle2, FileUp, Plus, Timer, UserPlus, Video, Paperclip } from "lucide-react";
import { familyIds, isSlotTaken, nextToken, notify, uid, useStore } from "@/lib/store";
import { slotsFor, isClosed, bookedCount } from "@/lib/slots";
import { predictWaitForSlot } from "@/lib/predict";
import { addDays, dayName, fmt12, fmtDate, parseDate, todayStr } from "@/lib/time";
import type { Appointment, VisitMode, VisitType } from "@/lib/types";
import { Avatar, Badge, Button, Card, Field, Modal, cx, inputCls, money } from "@/components/ui";
import { PageTitle } from "@/components/Shell";
import { PaymentModal, type PayMethod } from "@/components/PaymentModal";
import { UploadDialog, KIND_LABEL } from "@/components/UploadDialog";

function BookInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { state, update } = useStore();
  const fam = familyIds(state);
  const rescheduleId = params.get("reschedule");
  const original = state.appointments.find((a) => a.id === rescheduleId);

  const [pid, setPid] = useState(original?.patientId ?? params.get("for") ?? state.currentPatientId);
  const [date, setDate] = useState(() => {
    for (let i = 0; i < 14; i++) {
      const d = addDays(todayStr(), i);
      if (!isClosed(state, d) && slotsFor(state, d).some((s) => !s.taken && !s.past)) return d;
    }
    return todayStr();
  });
  const [time, setTime] = useState<string | null>(null);
  const [type, setType] = useState<VisitType>((original?.type ?? params.get("type") ?? "new") as VisitType);
  const [mode, setMode] = useState<VisitMode>(original?.mode ?? "clinic");
  const [symptoms, setSymptoms] = useState(original?.symptoms ?? "");
  const [attach, setAttach] = useState<string[]>(original?.uploadIds ?? []);
  const [pay, setPay] = useState(false);
  const [upload, setUpload] = useState(false);
  const [addMember, setAddMember] = useState(false);
  const [booked, setBooked] = useState<Appointment | null>(null);

  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(todayStr(), i)), []);
  const slots = slotsFor(state, date, rescheduleId ?? undefined);
  const fee = mode === "video" ? state.settings.videoFee : type === "followup" ? state.settings.followupFee : state.settings.fee;
  const patientUploads = state.uploads.filter((u) => u.patientId === pid);

  const confirm = (method?: PayMethod) => {
    if (!time) return;
    if (isSlotTaken(state, date, time, rescheduleId ?? undefined)) {
      alert("Sorry, that slot was just taken. Please pick another.");
      setTime(null);
      return;
    }
    const pname = state.patients.find((p) => p.id === pid)!.name;
    let result: Appointment | null = null;
    update((d) => {
      if (original) {
        const a = d.appointments.find((x) => x.id === original.id)!;
        const moved = a.date !== date;
        a.date = date;
        a.time = time;
        a.mode = mode;
        a.type = type;
        a.symptoms = symptoms;
        a.uploadIds = attach;
        if (moved) a.token = nextToken(d, date);
        result = { ...a };
        notify(d, { to: "doctor", text: `${pname} rescheduled to ${fmtDate(date)} ${fmt12(time)}` });
        notify(d, { to: "patient", patientId: pid, text: `Rescheduled: ${fmtDate(date)} at ${fmt12(time)}, token #${a.token}` });
      } else {
        const a: Appointment = {
          id: uid("a"),
          patientId: pid,
          date,
          time,
          token: nextToken(d, date),
          type,
          mode,
          status: "booked",
          symptoms,
          fee,
          paid: method !== "Clinic",
          payMethod: method === "Clinic" ? undefined : method,
          uploadIds: attach,
        };
        d.appointments.push(a);
        result = a;
        notify(d, { to: "doctor", text: `New booking: ${pname} · ${fmtDate(date)} ${fmt12(time)} (${mode === "video" ? "video" : "clinic"})` });
        notify(d, { to: "patient", patientId: pid, text: `Booked with Dr. Ananya Mehta on ${fmtDate(date)} at ${fmt12(time)}. Token #${a.token}. We'll remind you 24 h and 1 h before.` });
      }
    });
    setPay(false);
    setBooked(result);
  };

  if (booked) {
    const p = state.patients.find((x) => x.id === booked.patientId)!;
    return (
      <div className="mx-auto max-w-md space-y-4 pt-4">
        <Card className="overflow-hidden text-center">
          <div className="bg-brand-700 p-6 text-white">
            <CheckCircle2 size={48} className="mx-auto" />
            <div className="mt-2 text-xl font-semibold">{original ? "Appointment rescheduled" : "Appointment confirmed"}</div>
          </div>
          <div className="space-y-3 p-5">
            <div className="text-sm text-slate-500">Token number</div>
            <div className="text-5xl font-bold text-brand-800">#{booked.token}</div>
            <div className="font-medium">{fmtDate(booked.date, { weekday: true })} · {fmt12(booked.time)}</div>
            <div className="text-sm text-slate-500">{p.name} · {booked.mode === "video" ? "Video consultation" : "Clinic visit"} · {booked.paid ? `Paid ${booked.payMethod}` : "Pay at clinic"}</div>
            <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 p-3 text-sm">
              <Timer size={16} className="text-brand-700" /> Expected wait at clinic: ~{predictWaitForSlot(state, booked.date, booked.time)} min
            </div>
            <p className="text-xs text-slate-500">On the day, you&apos;ll see a live queue tracker with your exact predicted time.</p>
          </div>
        </Card>
        <div className="grid grid-cols-2 gap-3">
          <a
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-sm font-medium"
            href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("Dr. Ananya Mehta - appointment")}&dates=${booked.date.replaceAll("-", "")}T${booked.time.replace(":", "")}00/${booked.date.replaceAll("-", "")}T${booked.time.replace(":", "")}00`}
            target="_blank"
            rel="noreferrer"
          >
            Add to calendar
          </a>
          <Button onClick={() => router.push("/patient")}>Go to home</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageTitle title={original ? "Reschedule appointment" : "Book an appointment"} sub="Dr. Ananya Mehta · General Physician" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          {/* who */}
          <Card className="p-4">
            <div className="mb-3 text-sm font-semibold">Who is this visit for?</div>
            <div className="flex flex-wrap gap-2">
              {fam.map((id) => {
                const p = state.patients.find((x) => x.id === id)!;
                return (
                  <button
                    key={id}
                    disabled={!!original}
                    onClick={() => setPid(id)}
                    className={cx("flex items-center gap-2 rounded-xl border px-3 py-2 text-sm", pid === id ? "border-brand-600 bg-brand-50" : "border-slate-200")}
                  >
                    <Avatar name={p.name} size={28} />
                    <span className="text-left">
                      <span className="block font-medium">{p.name.split(" ")[0]}</span>
                      <span className="block text-xs text-slate-500">{p.relation ?? "Me"} · {p.age}y</span>
                    </span>
                  </button>
                );
              })}
              {!original && (
                <button onClick={() => setAddMember(true)} className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600">
                  <UserPlus size={16} /> Add family member
                </button>
              )}
            </div>
          </Card>

          {/* type */}
          <Card className="grid gap-4 p-4 sm:grid-cols-2">
            <div>
              <div className="mb-2 text-sm font-semibold">Visit type</div>
              <div className="grid grid-cols-2 gap-2">
                {(["new", "followup"] as const).map((t) => (
                  <button key={t} onClick={() => setType(t)} className={cx("rounded-xl border p-2.5 text-sm font-medium", type === t ? "border-brand-600 bg-brand-50 text-brand-800" : "border-slate-200")}>
                    {t === "new" ? "New problem" : "Follow-up"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 text-sm font-semibold">Consultation</div>
              <div className="grid grid-cols-2 gap-2">
                {(["clinic", "video"] as const).map((m) => (
                  <button key={m} onClick={() => setMode(m)} className={cx("flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-sm font-medium", mode === m ? "border-brand-600 bg-brand-50 text-brand-800" : "border-slate-200")}>
                    {m === "clinic" ? <Building2 size={16} /> : <Video size={16} />} {m === "clinic" ? "In clinic" : "Video"}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* date */}
          <Card className="p-4">
            <div className="mb-3 text-sm font-semibold">Choose a date</div>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {days.map((d) => {
                const closed = isClosed(state, d);
                const free = closed ? 0 : slotsFor(state, d).filter((s) => !s.taken && !s.past).length;
                return (
                  <button
                    key={d}
                    disabled={!!closed || free === 0}
                    onClick={() => {
                      setDate(d);
                      setTime(null);
                    }}
                    className={cx(
                      "flex w-16 shrink-0 flex-col items-center rounded-xl border py-2 text-sm",
                      date === d ? "border-brand-600 bg-brand-700 text-white" : "border-slate-200",
                      (closed || free === 0) && "cursor-not-allowed opacity-40",
                    )}
                  >
                    <span className="text-xs opacity-80">{dayName(d)}</span>
                    <span className="text-lg font-semibold">{parseDate(d).getDate()}</span>
                    <span className={cx("text-[10px]", date === d ? "text-white/80" : closed ? "text-rose-600" : "text-emerald-700")}>
                      {closed === "leave" ? "On leave" : closed ? "Closed" : `${free} free`}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* slots */}
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">Available slots · {fmtDate(date, { weekday: true })}</div>
              <span className="text-xs text-slate-500">{bookedCount(state, date)} booked</span>
            </div>
            {(["Morning", "Evening"] as const).map((sess) => {
              const list = slots.filter((s) => s.session === sess);
              if (!list.length) return null;
              return (
                <div key={sess} className="mb-4 last:mb-0">
                  <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">{sess}</div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {list.map((s) => {
                      const disabled = s.taken || s.past;
                      return (
                        <button
                          key={s.time}
                          disabled={disabled}
                          onClick={() => setTime(s.time)}
                          className={cx(
                            "rounded-xl border py-2 text-sm font-medium",
                            time === s.time ? "border-brand-700 bg-brand-700 text-white" : "border-slate-200 hover:border-brand-400",
                            disabled && "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 line-through hover:border-slate-100",
                          )}
                        >
                          {fmt12(s.time)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {time && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-brand-50 p-3 text-sm text-brand-900">
                <Timer size={16} /> Predicted wait for {fmt12(time)}: <b>~{predictWaitForSlot(state, date, time)} min</b> at the clinic
              </div>
            )}
          </Card>

          {/* symptoms + attach */}
          <Card className="space-y-4 p-4">
            <Field label="Symptoms or reason for visit" hint="Helps the doctor prepare before you arrive">
              <textarea className={cx(inputCls, "min-h-20")} value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="e.g. Fever since 2 days, mild cough" />
            </Field>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Attach old prescriptions / reports</span>
                <button onClick={() => setUpload(true)} className="flex items-center gap-1 text-sm font-medium text-brand-700">
                  <Plus size={16} /> Upload new
                </button>
              </div>
              {patientUploads.length === 0 ? (
                <button onClick={() => setUpload(true)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                  <FileUp size={18} /> Upload a photo or PDF
                </button>
              ) : (
                <div className="space-y-2">
                  {patientUploads.map((u) => (
                    <label key={u.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-2.5 text-sm">
                      <input
                        type="checkbox"
                        checked={attach.includes(u.id)}
                        onChange={(e) => setAttach((a) => (e.target.checked ? [...a, u.id] : a.filter((x) => x !== u.id)))}
                        className="h-4 w-4 accent-teal-700"
                      />
                      <Paperclip size={16} className="text-slate-400" />
                      <span className="flex-1 truncate">{u.name}</span>
                      <Badge>{KIND_LABEL[u.kind]}</Badge>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* summary */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card className="p-5">
            <div className="mb-3 font-semibold">Summary</div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Patient</dt><dd className="font-medium">{state.patients.find((p) => p.id === pid)?.name}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Date</dt><dd className="font-medium">{fmtDate(date)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Time</dt><dd className="font-medium">{time ? fmt12(time) : "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Type</dt><dd className="font-medium">{type === "new" ? "New problem" : "Follow-up"} · {mode === "video" ? "Video" : "Clinic"}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Attachments</dt><dd className="font-medium">{attach.length}</dd></div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-base"><dt>Fee</dt><dd className="font-semibold">{money(fee)}</dd></div>
            </dl>
            <Button className="mt-4 w-full" size="lg" disabled={!time} onClick={() => (original ? confirm() : setPay(true))}>
              <CalendarCheck size={18} /> {original ? "Confirm new time" : "Continue to pay"}
            </Button>
            <p className="mt-2 text-center text-xs text-slate-500">Free cancellation up to 2 hours before</p>
          </Card>
          <Link href="/patient/appointments" className="mt-3 block text-center text-sm text-slate-500">Cancel</Link>
        </div>
      </div>

      <PaymentModal open={pay} amount={fee} onClose={() => setPay(false)} onPaid={(m) => confirm(m)} />
      <UploadDialog open={upload} onClose={() => setUpload(false)} defaultPatientId={pid} onUploaded={(u) => setAttach((a) => [...a, u.id])} />
      <AddMemberModal open={addMember} onClose={() => setAddMember(false)} onAdded={(id) => setPid(id)} />
    </div>
  );
}

function AddMemberModal({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: (id: string) => void }) {
  const { state, update } = useStore();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | "Other">("Female");
  const [relation, setRelation] = useState("Spouse");
  return (
    <Modal open={open} onClose={onClose} title="Add family member">
      <div className="space-y-3">
        <Field label="Full name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Age"><input className={inputCls} inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} /></Field>
          <Field label="Gender">
            <select className={inputCls} value={gender} onChange={(e) => setGender(e.target.value as typeof gender)}>
              <option>Female</option><option>Male</option><option>Other</option>
            </select>
          </Field>
          <Field label="Relation">
            <select className={inputCls} value={relation} onChange={(e) => setRelation(e.target.value)}>
              {["Spouse", "Mother", "Father", "Son", "Daughter", "Other"].map((r) => <option key={r}>{r}</option>)}
            </select>
          </Field>
        </div>
        <Button
          className="w-full"
          disabled={!name || !age}
          onClick={() => {
            const id = uid("p");
            update((d) => {
              d.patients.push({ id, name, age: Number(age), gender, phone: d.patients.find((p) => p.id === d.currentPatientId)!.phone, allergies: [], conditions: [], familyOf: state.currentPatientId, relation, travelMins: 20 });
            });
            onAdded(id);
            setName("");
            setAge("");
            onClose();
          }}
        >
          Add member
        </Button>
      </div>
    </Modal>
  );
}

export default function Book() {
  return (
    <Suspense>
      <BookInner />
    </Suspense>
  );
}
