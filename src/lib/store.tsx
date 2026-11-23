"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { AppState, Appointment, Notification } from "./types";
import { makeSeed, STATE_VERSION } from "./seed";
import { todayStr } from "./time";

const KEY = "clinicflow-demo-state";

type Updater = (draft: AppState) => void;

interface Store {
  state: AppState;
  ready: boolean;
  update: (fn: Updater) => void;
  reset: () => void;
  now: number;
}

const Ctx = createContext<Store | null>(null);

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as AppState;
      if (s.version === STATE_VERSION && s.seededFor === todayStr()) return s;
    }
  } catch {}
  return makeSeed();
}

function save(s: AppState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Storage full (large uploads) — drop file bytes of the oldest uploads and retry
    try {
      const slim = structuredClone(s);
      slim.uploads.forEach((u, i) => {
        if (i < slim.uploads.length - 1) delete u.dataUrl;
      });
      localStorage.setItem(KEY, JSON.stringify(slim));
    } catch {}
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => makeSeed(0));
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const skipSave = useRef(true);

  useEffect(() => {
    setState(load());
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue) {
        try {
          skipSave.current = true;
          setState(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    const t = setInterval(() => setNow(Date.now()), 15000);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    save(state);
  }, [state, ready]);

  const update = useCallback((fn: Updater) => {
    setState((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
    setNow(Date.now());
  }, []);

  const reset = useCallback(() => {
    const s = makeSeed();
    setState(s);
    save(s);
  }, []);

  return <Ctx.Provider value={{ state, ready, update, reset, now }}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside provider");
  return s;
}

export const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function notify(draft: AppState, n: Omit<Notification, "id" | "at" | "read">) {
  draft.notifications.unshift({ ...n, id: uid("n"), at: Date.now(), read: false });
}

export function patientName(state: AppState, id: string) {
  return state.patients.find((p) => p.id === id)?.name ?? "Unknown";
}

export function familyIds(state: AppState): string[] {
  const me = state.currentPatientId;
  return state.patients.filter((p) => p.id === me || p.familyOf === me).map((p) => p.id);
}

export function nextToken(state: AppState, date: string): number {
  const toks = state.appointments.filter((a) => a.date === date).map((a) => a.token);
  return toks.length ? Math.max(...toks) + 1 : 1;
}

export function isSlotTaken(state: AppState, date: string, time: string, ignoreId?: string) {
  return state.appointments.some(
    (a: Appointment) =>
      a.date === date && a.time === time && a.status !== "cancelled" && a.id !== ignoreId,
  );
}
