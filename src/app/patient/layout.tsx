"use client";

import { CalendarPlus, FileHeart, Home, ListChecks, UserCircle } from "lucide-react";
import { Shell } from "@/components/Shell";

const NAV = [
  { href: "/patient", label: "Home", icon: Home },
  { href: "/patient/book", label: "Book", icon: CalendarPlus },
  { href: "/patient/appointments", label: "Visits", icon: ListChecks },
  { href: "/patient/records", label: "Records", icon: FileHeart },
  { href: "/patient/profile", label: "Profile", icon: UserCircle },
];

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <Shell role="patient" nav={NAV}>
      {children}
    </Shell>
  );
}
