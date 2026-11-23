"use client";

import { BarChart3, CalendarDays, ListOrdered, Settings2, Users } from "lucide-react";
import { Shell } from "@/components/Shell";

const NAV = [
  { href: "/doctor", label: "Queue", icon: ListOrdered },
  { href: "/doctor/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/doctor/patients", label: "Patients", icon: Users },
  { href: "/doctor/analytics", label: "Insights", icon: BarChart3 },
  { href: "/doctor/settings", label: "Settings", icon: Settings2 },
];

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <Shell role="doctor" nav={NAV}>
      {children}
    </Shell>
  );
}
