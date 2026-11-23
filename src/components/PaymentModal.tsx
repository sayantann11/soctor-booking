"use client";

import { useState } from "react";
import { CreditCard, Smartphone, Building2, CheckCircle2 } from "lucide-react";
import { Button, Modal, cx, money } from "./ui";

export type PayMethod = "UPI" | "Card" | "Clinic";

export function PaymentModal({
  open,
  amount,
  onClose,
  onPaid,
}: {
  open: boolean;
  amount: number;
  onClose: () => void;
  onPaid: (m: PayMethod) => void;
}) {
  const [method, setMethod] = useState<PayMethod>("UPI");
  const [stage, setStage] = useState<"choose" | "processing" | "done">("choose");

  const pay = () => {
    if (method === "Clinic") return onPaid("Clinic");
    setStage("processing");
    setTimeout(() => {
      setStage("done");
      setTimeout(() => {
        setStage("choose");
        onPaid(method);
      }, 900);
    }, 1400);
  };

  return (
    <Modal open={open} onClose={stage === "choose" ? onClose : () => {}} title="Payment">
      {stage === "choose" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
            <span className="text-sm text-slate-600">Consultation fee</span>
            <span className="text-xl font-semibold">{money(amount)}</span>
          </div>
          {(
            [
              { m: "UPI", icon: Smartphone, t: "UPI", d: "GPay, PhonePe, Paytm" },
              { m: "Card", icon: CreditCard, t: "Debit / credit card", d: "Visa, Mastercard, RuPay" },
              { m: "Clinic", icon: Building2, t: "Pay at clinic", d: "Cash or UPI at reception" },
            ] as const
          ).map((o) => (
            <button
              key={o.m}
              onClick={() => setMethod(o.m)}
              className={cx("flex w-full items-center gap-3 rounded-xl border p-3 text-left", method === o.m ? "border-brand-600 bg-brand-50" : "border-slate-200")}
            >
              <o.icon size={20} className="text-brand-700" />
              <div className="flex-1">
                <div className="text-sm font-medium">{o.t}</div>
                <div className="text-xs text-slate-500">{o.d}</div>
              </div>
              <span className={cx("h-4 w-4 rounded-full border-2", method === o.m ? "border-brand-700 bg-brand-700" : "border-slate-300")} />
            </button>
          ))}
          <Button className="w-full" size="lg" onClick={pay}>
            {method === "Clinic" ? "Confirm booking" : `Pay ${money(amount)}`}
          </Button>
          <p className="text-center text-xs text-slate-500">Demo payment — no money is charged.</p>
        </div>
      )}
      {stage === "processing" && (
        <div className="flex flex-col items-center py-10">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
          <div className="mt-4 text-sm text-slate-600">Processing {method} payment…</div>
        </div>
      )}
      {stage === "done" && (
        <div className="flex flex-col items-center py-10">
          <CheckCircle2 size={48} className="text-emerald-600" />
          <div className="mt-3 font-semibold">Payment successful</div>
        </div>
      )}
    </Modal>
  );
}
