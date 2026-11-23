export const pad = (n: number) => String(n).padStart(2, "0");

export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayStr(): string {
  return toDateStr(new Date());
}

export function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return toDateStr(dt);
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toMins(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function fromMins(mins: number): string {
  const m = ((Math.round(mins) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

export function fmt12(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${pad(m)} ${ap}`;
}

export function fmtClock(ms: number): string {
  const d = new Date(ms);
  return fmt12(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
}

export function slotToMs(dateStr: string, hhmm: string): number {
  const d = parseDate(dateStr);
  const mins = toMins(hhmm);
  d.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
  return d.getTime();
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmtDate(dateStr: string, opts: { weekday?: boolean } = {}): string {
  const d = parseDate(dateStr);
  const base = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  return opts.weekday ? `${DAYS[d.getDay()]}, ${base}` : base;
}

export function dayName(dateStr: string): string {
  return DAYS[parseDate(dateStr).getDay()];
}

export function shortDate(dateStr: string): string {
  const d = parseDate(dateStr);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function relDay(dateStr: string): string {
  const t = todayStr();
  if (dateStr === t) return "Today";
  if (dateStr === addDays(t, 1)) return "Tomorrow";
  if (dateStr === addDays(t, -1)) return "Yesterday";
  return fmtDate(dateStr, { weekday: true });
}

export function timeAgo(ms: number): string {
  const s = Math.round((Date.now() - ms) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}
