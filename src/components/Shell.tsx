"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, RotateCcw, Stethoscope, ArrowLeftRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { cx, Loading } from "./ui";
import { timeAgo } from "@/lib/time";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export function Shell({
  role,
  nav,
  children,
}: {
  role: "patient" | "doctor";
  nav: NavItem[];
  children: React.ReactNode;
}) {
  const { ready, state, update, reset } = useStore();
  const path = usePathname();
  const router = useRouter();
  const [showBell, setShowBell] = useState(false);

  const mine = state.notifications.filter((n) =>
    role === "doctor"
      ? n.to === "doctor"
      : n.to === "patient" &&
        state.patients.some((p) => p.id === n.patientId && (p.id === state.currentPatientId || p.familyOf === state.currentPatientId)),
  );
  const unread = mine.filter((n) => !n.read).length;
  const me = state.patients.find((p) => p.id === state.currentPatientId);

  const isActive = (href: string) => (href === `/${role}` ? path === href : path.startsWith(href));

  return (
    <div className="min-h-screen overflow-x-clip pb-20 md:pb-0 md:pl-64">
      {/* sidebar desktop */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <Link href="/" className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white">
            <Stethoscope size={20} />
          </div>
          <div>
            <div className="font-semibold leading-tight">ClinicFlow</div>
            <div className="text-xs text-slate-500">{role === "doctor" ? "Doctor dashboard" : "Patient app"}</div>
          </div>
        </Link>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                isActive(n.href) ? "bg-brand-50 text-brand-800" : "text-slate-600 hover:bg-slate-50",
              )}
            >
              <n.icon size={18} />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 border-t border-slate-200 p-3 text-sm">
          <button
            onClick={() => router.push(role === "doctor" ? "/patient" : "/doctor")}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeftRight size={16} /> Switch to {role === "doctor" ? "patient" : "doctor"} view
          </button>
          <button
            onClick={() => {
              if (confirm("Reset all demo data?")) reset();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw size={16} /> Reset demo data
          </button>
        </div>
      </aside>

      {/* top bar */}
      <header className="no-print sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:px-8">
        <Link href="/" className="flex items-center gap-2 md:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-white">
            <Stethoscope size={18} />
          </div>
          <span className="font-semibold">ClinicFlow</span>
        </Link>
        <div className="hidden text-sm text-slate-500 md:block">
          {role === "doctor" ? "Mehta Family Clinic · Dr. Ananya Mehta" : `Signed in as ${me?.name ?? ""}`}
        </div>
        <div className="flex items-center gap-1">
          <span className="mr-2 hidden rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 sm:inline">
            Demo · sample data
          </span>
          <button
            onClick={() => router.push(role === "doctor" ? "/patient" : "/doctor")}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            aria-label="Switch view"
          >
            <ArrowLeftRight size={20} />
          </button>
          <div className="relative">
            <button
              onClick={() => {
                setShowBell((v) => !v);
                if (!showBell && unread)
                  setTimeout(
                    () =>
                      update((d) => {
                        d.notifications.forEach((n) => {
                          if (mine.some((m) => m.id === n.id)) n.read = true;
                        });
                      }),
                    1500,
                  );
              }}
              className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              aria-label="Notifications"
            >
              <Bell size={20} />
              {unread > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </button>
            {showBell && (
              <div className="fade-in absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                <div className="px-2 py-1 text-sm font-semibold">Notifications</div>
                <div className="max-h-80 overflow-y-auto">
                  {mine.length === 0 && <div className="p-3 text-sm text-slate-500">Nothing yet.</div>}
                  {mine.slice(0, 20).map((n) => (
                    <div key={n.id} className={cx("rounded-xl p-2 text-sm", !n.read && "bg-brand-50")}>
                      <div>{n.text}</div>
                      <div className="mt-0.5 text-xs text-slate-500">{timeAgo(n.at)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              if (confirm("Reset all demo data?")) reset();
            }}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            aria-label="Reset demo"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 md:px-8 md:py-8">{ready ? children : <Loading />}</main>

      {/* bottom nav mobile */}
      <nav className="no-print fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white md:hidden">
        {nav.slice(0, 5).map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={cx(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
              isActive(n.href) ? "text-brand-700" : "text-slate-500",
            )}
          >
            <n.icon size={20} />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PageTitle({ title, sub, action }: { title: string; sub?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {sub && <p className="mt-0.5 text-sm text-slate-500">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
