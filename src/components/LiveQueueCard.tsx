"use client";

import { useState } from "react";
import { Car, Info, MapPin, Timer, Video } from "lucide-react";
import { notify, useStore } from "@/lib/store";
import { queueInfo } from "@/lib/predict";
import { fmt12, fmtClock } from "@/lib/time";
import type { Appointment } from "@/lib/types";
import { Badge, Button, Card, Modal, StatusBadge, cx } from "./ui";

export function LiveQueueCard({ appt }: { appt: Appointment }) {
  const { state, now, update } = useStore();
  const [why, setWhy] = useState(false);
  const q = queueInfo(state, now);
  const entry = q.waiting.find((w) => w.appt.id === appt.id);
  const patient = state.patients.find((p) => p.id === appt.patientId);
  const travel = patient?.travelMins ?? 20;
  const serving = q.current?.token;
  const progress = Math.min(100, Math.round(((q.done + q.noShow) / Math.max(1, q.total)) * 100));

  if (appt.status === "in-consult") {
    return (
      <Card className="overflow-hidden border-brand-200">
        <div className="bg-brand-700 p-5 text-white">
          <div className="text-sm opacity-80">Token #{appt.token} · {patient?.name}</div>
          <div className="mt-1 text-2xl font-bold">It&apos;s your turn — please go in</div>
        </div>
      </Card>
    );
  }
  if (!entry) {
    return (
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Token #{appt.token} · {fmt12(appt.time)}</div>
          <StatusBadge status={appt.status} />
        </div>
      </Card>
    );
  }

  const leaveBy = entry.etaMs - travel * 60000;
  const leaveNow = leaveBy <= now;

  return (
    <Card className="overflow-hidden border-brand-200">
      <div className="bg-gradient-to-br from-brand-700 to-brand-900 p-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm opacity-90">
              <span className="pulse-dot h-2 w-2 rounded-full bg-emerald-300" /> Live queue · {patient?.name}
            </div>
            <div className="mt-2 text-sm opacity-80">Expected consultation time</div>
            <div className="text-4xl font-bold tracking-tight">{fmtClock(entry.etaMs)}</div>
            <div className="text-sm opacity-80">±{entry.plusMinus} min · booked for {fmt12(appt.time)}</div>
          </div>
          <div className="rounded-2xl bg-white/15 px-4 py-3 text-center">
            <div className="text-xs opacity-80">Your token</div>
            <div className="text-3xl font-bold">#{appt.token}</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs opacity-80">
            <span>Now serving #{serving ?? "—"}</span>
            <span>{entry.position === 1 ? "You are next" : `${entry.position - 1} ahead of you`}</span>
          </div>
          <div className="h-2 rounded-full bg-white/20">
            <div className="h-2 rounded-full bg-emerald-300 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-3">
        <div className={cx("flex items-center gap-3 rounded-xl p-3", leaveNow ? "bg-amber-50" : "bg-slate-50")}>
          {appt.mode === "video" ? <Video size={20} className="text-brand-700" /> : <Car size={20} className={leaveNow ? "text-amber-700" : "text-brand-700"} />}
          <div className="text-sm">
            <div className="text-slate-500">{appt.mode === "video" ? "Join call at" : "Leave home by"}</div>
            <div className="font-semibold">{appt.mode === "video" ? fmtClock(entry.etaMs - 2 * 60000) : leaveNow ? "Leave now" : fmtClock(leaveBy)}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <Timer size={20} className="text-brand-700" />
          <div className="text-sm">
            <div className="text-slate-500">Doctor running</div>
            <div className="font-semibold">{entry.delayMins > 2 ? `${entry.delayMins} min behind` : "On time"}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {appt.status === "booked" ? (
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() =>
                update((d) => {
                  const a = d.appointments.find((x) => x.id === appt.id)!;
                  a.status = "checked-in";
                  notify(d, { to: "doctor", text: `${patient?.name} (token #${appt.token}) checked in / is on the way` });
                })
              }
            >
              <MapPin size={16} /> I&apos;m on my way
            </Button>
          ) : (
            <Badge tone="violet" className="flex-1 justify-center py-2">Checked in</Badge>
          )}
          <button onClick={() => setWhy(true)} className="rounded-xl p-2.5 text-slate-500 hover:bg-slate-100" aria-label="How is this predicted?">
            <Info size={18} />
          </button>
        </div>
      </div>
      {state.settings.delayMins > 0 && (
        <div className="mx-4 mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          Doctor update: running about {state.settings.delayMins} min late{state.settings.delayNote ? ` — ${state.settings.delayNote}` : ""}. Times above already include this.
        </div>
      )}

      <Modal open={why} onClose={() => setWhy(false)} title="How we predict your time">
        <div className="space-y-3 text-sm text-slate-600">
          <p>The prediction learns from the doctor&apos;s actual consultations over the last 45 days ({q.stats.sampleSize} visits) and updates live as the queue moves.</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-slate-50 p-3"><div className="text-xs">New patient</div><b>{q.stats.avgNew} min</b></div>
            <div className="rounded-xl bg-slate-50 p-3"><div className="text-xs">Follow-up</div><b>{q.stats.avgFollowup} min</b></div>
          </div>
          <ul className="list-disc space-y-1 pl-5">
            <li>Current patient: about {Math.round(q.currentRemainingMins)} min left</li>
            <li>{entry.position - 1} patient(s) ahead, each estimated by visit type</li>
            {state.settings.delayMins > 0 && <li>Doctor&apos;s announced delay: {state.settings.delayMins} min</li>}
            <li>Never earlier than your booked slot</li>
            <li>Travel time from your profile: {travel} min</li>
          </ul>
        </div>
      </Modal>
    </Card>
  );
}
