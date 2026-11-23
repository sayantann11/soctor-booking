"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Stethoscope, UserRound, Smartphone } from "lucide-react";
import { Button, Card, cx, inputCls } from "@/components/ui";

function LoginInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [role, setRole] = useState<"patient" | "doctor">(params.get("role") === "doctor" ? "doctor" : "patient");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState(role === "doctor" ? "98765 43210" : "90000 11111");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);

  const go = () => router.push(role === "doctor" ? "/doctor" : "/patient");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-slate-50 px-4">
      <Card className="w-full max-w-sm p-6">
        <Link href="/" className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white"><Stethoscope size={20} /></div>
          <span className="font-semibold">ClinicFlow</span>
        </Link>
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-sm font-medium">
          {(["patient", "doctor"] as const).map((r) => (
            <button
              key={r}
              onClick={() => {
                setRole(r);
                setStep("phone");
                setOtp("");
                setPhone(r === "doctor" ? "98765 43210" : "90000 11111");
              }}
              className={cx("rounded-lg py-2 capitalize", role === r ? "bg-white shadow-sm" : "text-slate-500")}
            >
              {r}
            </button>
          ))}
        </div>

        {step === "phone" ? (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-semibold">Sign in with mobile</h1>
              <p className="text-sm text-slate-500">We&apos;ll send a one-time code. No password needed.</p>
            </div>
            <div className="flex gap-2">
              <span className="flex items-center rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm">+91</span>
              <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
            </div>
            <Button
              className="w-full"
              size="lg"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                setTimeout(() => {
                  setBusy(false);
                  setStep("otp");
                  setTimeout(() => setOtp("4321"), 700);
                }, 600);
              }}
            >
              <Smartphone size={18} /> {busy ? "Sending…" : "Send OTP"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-semibold">Enter OTP</h1>
              <p className="text-sm text-slate-500">Sent to +91 {phone}. In this demo the code fills in automatically.</p>
            </div>
            <input className={cx(inputCls, "text-center text-2xl tracking-[0.6em]")} value={otp} maxLength={4} onChange={(e) => setOtp(e.target.value)} />
            <Button className="w-full" size="lg" disabled={otp.length < 4} onClick={go}>
              Verify & continue
            </Button>
          </div>
        )}

        <div className="mt-6 border-t border-slate-100 pt-4 text-center">
          <button onClick={go} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline">
            <UserRound size={16} /> Skip — continue as demo {role}
          </button>
        </div>
      </Card>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
