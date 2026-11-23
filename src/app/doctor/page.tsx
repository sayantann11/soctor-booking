"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BellRing,
  CheckCircle2,
  ChevronDown,
  Clock,
  FilePen,
  Megaphone,
  Paperclip,
  PhoneCall,
  SkipForward,
  Timer,
  UserPlus,
  UserX,
  Users,
  Video,
  Wallet,
} from "lucide-react";
import { notify, useStore } from "@/lib/store";
import { queueInfo } from "@/lib/predict";
import { callNext, addWalkIn, finishCurrent } from "@/lib/queueActions";
import { fmt12, fmtClock, fmtDate, todayStr } from "@/lib/time";
import { Avatar, Badge, Button, Card, Field, Modal, Stat, StatusBadge, cx, inputCls, money } from "@/components/ui";
import { PageTitle } from "@/components/Shell";

export default function DoctorQueue() {
  const { state, update, now } = useStore();
  const q = queueInfo(state, now);
  const today = todayStr();
  const todays = state.appointments.filter((a) => a.date === today && a.status !== "cancelled");
  const earnings = todays.filter((a) => a.paid).reduce((s, a) => s + a.fee, 0);
  const [walkIn, setWalkIn] = useState(false);
  const [broadcast, setBroadcast] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const cur = q.current;
  const curP = cur && state.patients.find((p) => p.id === cur.patientId);
  const doneList = todays.filter((a) => a.status === "done" || a.status === "no-show").sort((a, b) => a.token - b.token);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Today's queue"
        sub={fmtDate(today, { weekday: true })}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setBroadcast(true)}><Megaphone size={16} /> Running late</Button>
            <Button variant="secondary" onClick={() => setWalkIn(true)}><UserPlus size={16} /> Walk-in</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Patients today" value={todays.length} sub={`${q.done} seen · ${q.noShow} no-show`} icon={<Users size={16} />} />
        <Stat label="Waiting" value={q.waiting.length} sub={q.waiting.length ? `Last done ~${fmtClock(q.waiting.at(-1)!.etaMs + 10 * 60000)}` : "Queue clear"} icon={<Clock size={16} />} />
        <Stat label="Avg consult" value={`${q.stats.avgAll} min`} sub={`New ${q.stats.avgNew} · F/U ${q.stats.avgFollowup}`} icon={<Timer size={16} />} />
        <Stat label="Running behind" value={q.runningLateMins > 2 ? `${q.runningLateMins} min` : "On time"} sub={state.settings.delayMins ? `Announced +${state.settings.delayMins} min` : "No delay announced"} icon={<BellRing size={16} />} />
        <Stat label="Collected today" value={money(earnings)} sub={`${todays.filter((a) => !a.paid).length} unpaid`} icon={<Wallet size={16} />} />
      </div>

      {/* current */}
      <Card className={cx("overflow-hidden", cur && "border-brand-300")}>
        <div className="flex flex-wrap items-center gap-4 p-5">
          {cur && curP ? (
            <>
              <div className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-brand-700 text-white">
                <span className="text-[10px] opacity-80">TOKEN</span>
                <span className="text-2xl font-bold leading-none">{cur.token}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs font-medium text-brand-700"><span className="pulse-dot h-2 w-2 rounded-full bg-brand-600" /> IN CONSULTATION · {Math.floor(q.currentElapsedMins)} min</div>
                <div className="text-lg font-semibold">{curP.name} <span className="text-sm font-normal text-slate-500">· {curP.age}y {curP.gender[0]}</span></div>
                <div className="truncate text-sm text-slate-500">{cur.symptoms}</div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge tone={cur.type === "new" ? "violet" : "blue"}>{cur.type === "new" ? "New" : "Follow-up"}</Badge>
                  {cur.mode === "video" && <Badge tone="teal"><Video size={12} /> Video</Badge>}
                  {curP.allergies.map((a) => <Badge key={a} tone="red">Allergy: {a}</Badge>)}
                  {(cur.uploadIds?.length ?? 0) > 0 && <Badge tone="amber"><Paperclip size={12} /> {cur.uploadIds!.length} report(s)</Badge>}
                </div>
              </div>
              <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                <Link href={`/doctor/consult/${cur.id}`} className="flex-1 sm:flex-none"><Button className="w-full"><FilePen size={16} /> Write prescription</Button></Link>
                <Button variant="secondary" className="flex-1 sm:flex-none" onClick={() => update((d) => callNext(d))}>
                  <CheckCircle2 size={16} /> Done · call next
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex-1">
                <div className="font-semibold">No one in consultation</div>
                <div className="text-sm text-slate-500">{q.waiting.length ? `${q.waiting.length} patient(s) waiting` : "The queue is clear for now."}</div>
              </div>
              {q.waiting.length > 0 && (
                <Button size="lg" onClick={() => update((d) => callNext(d))}><PhoneCall size={18} /> Call #{q.waiting[0].appt.token}</Button>
              )}
            </>
          )}
        </div>
      </Card>

      {/* waiting */}
      <section>
        <h2 className="mb-2 font-semibold">Waiting ({q.waiting.length})</h2>
        <Card className="divide-y divide-slate-100">
          {q.waiting.length === 0 && <div className="p-4 text-sm text-slate-500">Nobody waiting.</div>}
          {q.waiting.map((w) => {
            const a = w.appt;
            const p = state.patients.find((x) => x.id === a.patientId)!;
            return (
              <div key={a.id} className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-semibold">#{a.token}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Link href={`/doctor/patients/${p.id}`} className="font-medium hover:underline">{p.name}</Link>
                    <span className="text-xs text-slate-500">{p.age}y {p.gender[0]}</span>
                    <StatusBadge status={a.status} />
                    {a.walkIn && <Badge>Walk-in</Badge>}
                    {a.mode === "video" && <Badge tone="teal"><Video size={12} /> Video</Badge>}
                    {(a.uploadIds?.length ?? 0) > 0 && <Badge tone="amber"><Paperclip size={12} /> {a.uploadIds!.length}</Badge>}
                    {!a.paid && <Badge tone="red">Unpaid</Badge>}
                  </div>
                  <div className="truncate text-sm text-slate-500">{a.symptoms}</div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-semibold">{fmtClock(w.etaMs)}</div>
                  <div className={cx("text-xs", w.delayMins > 10 ? "text-amber-700" : "text-slate-500")}>slot {fmt12(a.time)}{w.delayMins > 2 ? ` · +${w.delayMins}m` : ""}</div>
                </div>
                <div className="flex gap-1">
                  <button title="Call now" onClick={() => update((d) => callNext(d, a.id))} className="rounded-lg p-2 text-brand-700 hover:bg-brand-50"><PhoneCall size={18} /></button>
                  <button
                    title="Move to end"
                    onClick={() =>
                      update((d) => {
                        const x = d.appointments.find((y) => y.id === a.id)!;
                        const max = Math.max(...d.appointments.filter((y) => y.date === today).map((y) => y.token));
                        x.token = max + 1;
                        notify(d, { to: "patient", patientId: x.patientId, text: `Your token changed to #${x.token} as you were not present.` });
                      })
                    }
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  >
                    <SkipForward size={18} />
                  </button>
                  <button
                    title="Mark no-show"
                    onClick={() =>
                      update((d) => {
                        d.appointments.find((y) => y.id === a.id)!.status = "no-show";
                      })
                    }
                    className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"
                  >
                    <UserX size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </Card>
      </section>

      {/* done */}
      <section>
        <button onClick={() => setShowDone((v) => !v)} className="mb-2 flex items-center gap-1 font-semibold">
          Completed ({doneList.length}) <ChevronDown size={16} className={cx("transition", showDone && "rotate-180")} />
        </button>
        {showDone && (
          <Card className="divide-y divide-slate-100">
            {doneList.map((a) => {
              const p = state.patients.find((x) => x.id === a.patientId)!;
              const rx = state.prescriptions.find((r) => r.appointmentId === a.id);
              return (
                <div key={a.id} className="flex items-center gap-3 p-3 text-sm">
                  <span className="w-8 text-slate-400">#{a.token}</span>
                  <Avatar name={p.name} size={28} />
                  <span className="flex-1 font-medium">{p.name}</span>
                  {a.consultMins && <span className="text-slate-500">{a.consultMins} min</span>}
                  <StatusBadge status={a.status} />
                  {rx ? <Link href={`/prescription/${rx.id}`} className="text-brand-700">Rx</Link> : a.status === "done" && <Link href={`/doctor/consult/${a.id}`} className="text-slate-500">Add Rx</Link>}
                </div>
              );
            })}
          </Card>
        )}
      </section>

      {cur && (
        <div className="text-center">
          <button onClick={() => update((d) => finishCurrent(d))} className="text-sm text-slate-500 hover:underline">Finish current without calling next</button>
        </div>
      )}

      <WalkInModal open={walkIn} onClose={() => setWalkIn(false)} />
      <BroadcastModal open={broadcast} onClose={() => setBroadcast(false)} waitingCount={q.waiting.length} />
    </div>
  );
}

function WalkInModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { update } = useStore();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | "Other">("Male");
  return (
    <Modal open={open} onClose={onClose} title="Add walk-in patient">
      <div className="space-y-3">
        <Field label="Name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Age"><input className={inputCls} inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} /></Field>
          <Field label="Gender">
            <select className={inputCls} value={gender} onChange={(e) => setGender(e.target.value as typeof gender)}><option>Male</option><option>Female</option><option>Other</option></select>
          </Field>
        </div>
        <Field label="Mobile" hint="Patient gets an SMS with token and live queue link"><input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
        <Button
          className="w-full"
          disabled={!name}
          onClick={() => {
            update((d) => addWalkIn(d, name, Number(age) || 30, gender, phone || "—"));
            setName("");
            setAge("");
            setPhone("");
            onClose();
          }}
        >
          Add to queue
        </Button>
      </div>
    </Modal>
  );
}

function BroadcastModal({ open, onClose, waitingCount }: { open: boolean; onClose: () => void; waitingCount: number }) {
  const { state, update } = useStore();
  const [mins, setMins] = useState(state.settings.delayMins || 20);
  const [note, setNote] = useState("Emergency case at the clinic");
  return (
    <Modal open={open} onClose={onClose} title="Tell patients you're running late">
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {[10, 20, 30, 45].map((m) => (
            <button key={m} onClick={() => setMins(m)} className={cx("rounded-xl border py-2 text-sm font-medium", mins === m ? "border-brand-600 bg-brand-50" : "border-slate-200")}>+{m} min</button>
          ))}
        </div>
        <Field label="Reason (optional)"><input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
          {waitingCount} waiting patient(s) get a WhatsApp/SMS and their predicted times update automatically.
        </div>
        <div className="flex gap-2">
          {state.settings.delayMins > 0 && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                update((d) => {
                  d.settings.delayMins = 0;
                  d.settings.delayNote = undefined;
                });
                onClose();
              }}
            >
              Clear delay
            </Button>
          )}
          <Button
            className="flex-1"
            onClick={() => {
              update((d) => {
                d.settings.delayMins = mins;
                d.settings.delayNote = note;
                const ids = new Set(d.appointments.filter((a) => a.date === todayStr() && (a.status === "booked" || a.status === "checked-in")).map((a) => a.patientId));
                ids.forEach((pid) => notify(d, { to: "patient", patientId: pid, text: `Dr. Ananya Mehta is running about ${mins} min late${note ? ` (${note})` : ""}. Your predicted time has been updated.` }));
              });
              onClose();
            }}
          >
            <Megaphone size={16} /> Send update
          </Button>
        </div>
      </div>
    </Modal>
  );
}
