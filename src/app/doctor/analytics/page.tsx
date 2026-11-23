"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { consultStats } from "@/lib/predict";
import { addDays, shortDate, todayStr } from "@/lib/time";
import { Card, Stat, Stars, money, cx, Button, inputCls } from "@/components/ui";
import { PageTitle } from "@/components/Shell";

function Bars({ data, color = "bg-brand-600", fmt = (v: number) => String(v), highlightMax }: { data: { label: string; value: number }[]; color?: string; fmt?: (v: number) => string; highlightMax?: boolean }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex h-44 items-end gap-[3px]">
      {data.map((d, i) => (
        <div key={i} className="group relative flex h-full flex-1 flex-col justify-end">
          <div
            className={cx("rounded-t-sm transition", highlightMax && d.value === max ? "bg-amber-500" : color, "group-hover:opacity-80")}
            style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value ? 2 : 0 }}
          />
          <div className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-white group-hover:block">
            {d.label}: {fmt(d.value)}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Analytics() {
  const { state } = useStore();
  const today = todayStr();
  const from = addDays(today, -30);
  const range = state.appointments.filter((a) => a.date >= from && a.date <= today);
  const done = range.filter((a) => a.status === "done");
  const noShow = range.filter((a) => a.status === "no-show").length;
  const cancelled = range.filter((a) => a.status === "cancelled").length;
  const revenue = done.reduce((s, a) => s + a.fee, 0);
  const stats = consultStats(state);

  const daily = Array.from({ length: 30 }, (_, i) => {
    const d = addDays(today, -29 + i);
    return { label: shortDate(d), value: range.filter((a) => a.date === d && a.status === "done").length };
  });
  const hours = Array.from({ length: 13 }, (_, i) => 9 + i).map((h) => ({
    label: `${h % 12 || 12}${h < 12 ? "am" : "pm"}`,
    value: range.filter((a) => Number(a.time.slice(0, 2)) === h && a.status !== "cancelled").length,
  }));
  const dow = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((n, i) => ({
    label: n,
    value: range.filter((a) => new Date(a.date + "T00:00").getDay() === i + 1 && a.status === "done").length,
  }));
  const newCount = done.filter((a) => a.type === "new").length;
  const pay = ["UPI", "Card", "Clinic"].map((m) => ({ m, n: done.filter((a) => a.payMethod === m).length }));
  const videoCount = done.filter((a) => a.mode === "video").length;
  const avgRating = state.reviews.reduce((s, r) => s + r.rating, 0) / Math.max(1, state.reviews.length);
  const peak = hours.reduce((a, b) => (b.value > a.value ? b : a), hours[0]);

  return (
    <div className="space-y-6">
      <PageTitle title="Clinic insights" sub="Last 30 days" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Patients seen" value={done.length} sub={`${(done.length / 26).toFixed(1)} per working day`} />
        <Stat label="Revenue" value={money(revenue)} sub={`${money(Math.round(revenue / Math.max(1, done.length)))} per visit`} />
        <Stat label="No-show rate" value={`${Math.round((noShow / Math.max(1, range.length)) * 100)}%`} sub={`${noShow} no-shows · ${cancelled} cancelled`} />
        <Stat label="Avg consult time" value={`${stats.avgAll} min`} sub={`New ${stats.avgNew} · Follow-up ${stats.avgFollowup}`} />
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Patients per day</h2>
          <span className="text-xs text-slate-500">hover for values</span>
        </div>
        <Bars data={daily} />
        <div className="mt-2 flex justify-between text-xs text-slate-400"><span>{daily[0].label}</span><span>{daily.at(-1)!.label}</span></div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold">Peak hours</h2>
          <p className="mb-4 text-sm text-slate-500">Busiest at <b>{peak.label}</b> — consider an extra slot or receptionist then.</p>
          <Bars data={hours} highlightMax />
          <div className="mt-2 flex justify-between text-xs text-slate-400">{hours.filter((_, i) => i % 3 === 0).map((h) => <span key={h.label}>{h.label}</span>)}</div>
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Busiest days</h2>
          <div className="space-y-2">
            {dow.map((d) => {
              const max = Math.max(...dow.map((x) => x.value));
              return (
                <div key={d.label} className="flex items-center gap-3 text-sm">
                  <span className="w-10 text-slate-500">{d.label}</span>
                  <div className="h-6 flex-1 rounded-md bg-slate-100">
                    <div className={cx("h-6 rounded-md", d.value === max ? "bg-amber-500" : "bg-brand-500")} style={{ width: `${(d.value / Math.max(1, max)) * 100}%` }} />
                  </div>
                  <span className="w-8 text-right font-medium">{d.value}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">New vs returning</h2>
          <div className="flex h-4 overflow-hidden rounded-full">
            <div className="bg-violet-500" style={{ width: `${(newCount / Math.max(1, done.length)) * 100}%` }} />
            <div className="flex-1 bg-sky-500" />
          </div>
          <div className="mt-3 flex justify-between text-sm">
            <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-violet-500" />New {newCount}</span>
            <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-sky-500" />Returning {done.length - newCount}</span>
          </div>
          <div className="mt-3 text-sm text-slate-500">{videoCount} video consults ({Math.round((videoCount / Math.max(1, done.length)) * 100)}%)</div>
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">Payment modes</h2>
          {pay.map((p) => (
            <div key={p.m} className="mb-2 flex items-center gap-3 text-sm">
              <span className="w-14 text-slate-500">{p.m}</span>
              <div className="h-3 flex-1 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-brand-600" style={{ width: `${(p.n / Math.max(1, done.length)) * 100}%` }} /></div>
              <span className="w-10 text-right">{Math.round((p.n / Math.max(1, done.length)) * 100)}%</span>
            </div>
          ))}
        </Card>
        <Card className="p-5">
          <h2 className="mb-1 font-semibold">Patient rating</h2>
          <div className="flex items-baseline gap-2"><span className="text-3xl font-bold">{avgRating.toFixed(1)}</span><Stars value={avgRating} /></div>
          <div className="text-sm text-slate-500">{state.reviews.length} recent reviews</div>
        </Card>
      </div>

      <Reviews />
    </div>
  );
}

function Reviews() {
  const { state, update } = useStore();
  const [replying, setReplying] = useState<string | null>(null);
  const [text, setText] = useState("");
  return (
    <section>
      <h2 className="mb-2 font-semibold">Reviews</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {state.reviews.slice(0, 8).map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{r.patientName}</span>
              <Stars value={r.rating} size={12} />
            </div>
            <p className="mt-1 text-sm text-slate-600">{r.text}</p>
            {r.reply && <p className="mt-2 rounded-lg bg-brand-50 p-2 text-xs text-brand-900">You replied: {r.reply}</p>}
            {!r.reply && replying !== r.id && <button onClick={() => { setReplying(r.id); setText("Thank you for your kind words!"); }} className="mt-2 text-xs font-medium text-brand-700">Reply</button>}
            {replying === r.id && (
              <div className="mt-2 flex gap-2">
                <input className={inputCls} value={text} onChange={(e) => setText(e.target.value)} />
                <Button size="sm" onClick={() => { update((d) => { d.reviews.find((x) => x.id === r.id)!.reply = text; }); setReplying(null); }}>Send</Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}
