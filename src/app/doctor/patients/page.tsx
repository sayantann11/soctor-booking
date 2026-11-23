"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { shortDate } from "@/lib/time";
import { Avatar, Badge, Card, inputCls } from "@/components/ui";
import { PageTitle } from "@/components/Shell";

export default function Patients() {
  const { state } = useStore();
  const [q, setQ] = useState("");
  const rows = state.patients
    .map((p) => {
      const visits = state.appointments.filter((a) => a.patientId === p.id && a.status === "done");
      const last = visits.sort((a, b) => b.date.localeCompare(a.date))[0];
      return { p, visits: visits.length, last: last?.date, uploads: state.uploads.filter((u) => u.patientId === p.id).length };
    })
    .filter((r) => r.visits > 0 || r.uploads > 0 || state.appointments.some((a) => a.patientId === r.p.id))
    .filter((r) => !q || r.p.name.toLowerCase().includes(q.toLowerCase()) || r.p.phone.includes(q))
    .sort((a, b) => (b.last ?? "").localeCompare(a.last ?? ""));

  return (
    <div>
      <PageTitle title="Patients" sub={`${rows.length} patients`} />
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className={`${inputCls} pl-10`} placeholder="Search by name or mobile" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Card className="divide-y divide-slate-100">
        {rows.map(({ p, visits, last, uploads }) => (
          <Link key={p.id} href={`/doctor/patients/${p.id}`} className="flex items-center gap-3 p-3 hover:bg-slate-50">
            <Avatar name={p.name} size={40} />
            <div className="min-w-0 flex-1">
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-slate-500">{p.age}y {p.gender[0]} · {p.phone}</div>
            </div>
            <div className="hidden gap-1 sm:flex">
              {p.conditions.slice(0, 2).map((c) => <Badge key={c} tone="amber">{c}</Badge>)}
            </div>
            <div className="text-right text-xs text-slate-500">
              <div>{visits} visits{uploads ? ` · ${uploads} files` : ""}</div>
              <div>{last ? `Last ${shortDate(last)}` : "New"}</div>
            </div>
            <ChevronRight size={18} className="text-slate-400" />
          </Link>
        ))}
      </Card>
    </div>
  );
}
