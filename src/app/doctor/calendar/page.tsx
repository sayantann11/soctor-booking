"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Video } from "lucide-react";
import { useStore } from "@/lib/store";
import { isClosed } from "@/lib/slots";
import { addDays, dayName, fmt12, fmtDate, parseDate, todayStr } from "@/lib/time";
import { Button, Card, StatusBadge, cx } from "@/components/ui";
import { PageTitle } from "@/components/Shell";

export default function CalendarPage() {
  const { state } = useStore();
  const [start, setStart] = useState(todayStr());
  const [sel, setSel] = useState(todayStr());
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const list = state.appointments.filter((a) => a.date === sel && a.status !== "cancelled").sort((a, b) => a.time.localeCompare(b.time));
  const cancelled = state.appointments.filter((a) => a.date === sel && a.status === "cancelled").length;

  return (
    <div>
      <PageTitle
        title="Calendar"
        sub="All bookings by day"
        action={
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => setStart(addDays(start, -7))}><ChevronLeft size={16} /></Button>
            <Button variant="outline" size="sm" onClick={() => { setStart(todayStr()); setSel(todayStr()); }}>Today</Button>
            <Button variant="outline" size="sm" onClick={() => setStart(addDays(start, 7))}><ChevronRight size={16} /></Button>
          </div>
        }
      />
      <div className="mb-5 grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const n = state.appointments.filter((a) => a.date === d && a.status !== "cancelled").length;
          const closed = isClosed(state, d);
          const load = Math.min(1, n / state.settings.maxPerDay);
          return (
            <button key={d} onClick={() => setSel(d)} className={cx("rounded-xl border p-2 text-center", sel === d ? "border-brand-600 bg-brand-700 text-white" : "border-slate-200 bg-white")}>
              <div className="text-xs opacity-75">{dayName(d)}</div>
              <div className="text-lg font-semibold">{parseDate(d).getDate()}</div>
              <div className="text-[10px]">{closed === "leave" ? "Leave" : closed ? "Closed" : `${n} appts`}</div>
              {!closed && (
                <div className={cx("mt-1 h-1 rounded-full", sel === d ? "bg-white/30" : "bg-slate-100")}>
                  <div className={cx("h-1 rounded-full", sel === d ? "bg-white" : load > 0.7 ? "bg-amber-500" : "bg-brand-500")} style={{ width: `${load * 100}%` }} />
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold">{fmtDate(sel, { weekday: true })}</h2>
        <span className="text-sm text-slate-500">{list.length} appointments{cancelled ? ` · ${cancelled} cancelled` : ""}</span>
      </div>
      <Card className="divide-y divide-slate-100">
        {isClosed(state, sel) && <div className="p-4 text-sm text-slate-500">Clinic closed{isClosed(state, sel) === "leave" ? " (doctor on leave)" : " on Sundays"}.</div>}
        {!isClosed(state, sel) && list.length === 0 && <div className="p-4 text-sm text-slate-500">No bookings.</div>}
        {list.map((a) => {
          const p = state.patients.find((x) => x.id === a.patientId)!;
          return (
            <div key={a.id} className="flex items-center gap-3 p-3 text-sm">
              <span className="w-20 font-medium">{fmt12(a.time)}</span>
              <span className="w-10 text-slate-400">#{a.token}</span>
              <Link href={`/doctor/patients/${p.id}`} className="flex-1 truncate font-medium hover:underline">{p.name}</Link>
              <span className="hidden flex-1 truncate text-slate-500 md:block">{a.symptoms}</span>
              {a.mode === "video" && <Video size={16} className="text-brand-700" />}
              <StatusBadge status={a.status} />
            </div>
          );
        })}
      </Card>
    </div>
  );
}
