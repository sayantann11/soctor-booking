"use client";

import { useRef, useState } from "react";
import { FileUp, UploadCloud } from "lucide-react";
import { familyIds, notify, uid, useStore } from "@/lib/store";
import type { Upload, UploadKind } from "@/lib/types";
import { todayStr } from "@/lib/time";
import { Button, Field, Modal, inputCls, cx } from "./ui";

const MAX_INLINE = 1.5 * 1024 * 1024;

export const KIND_LABEL: Record<UploadKind, string> = {
  prescription: "Old prescription",
  lab: "Lab report",
  scan: "X-ray / scan",
  other: "Other",
};

export function UploadDialog({
  open,
  onClose,
  defaultPatientId,
  onUploaded,
}: {
  open: boolean;
  onClose: () => void;
  defaultPatientId?: string;
  onUploaded?: (u: Upload) => void;
}) {
  const { state, update } = useStore();
  const fam = familyIds(state);
  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState<UploadKind>("prescription");
  const [pid, setPid] = useState(defaultPatientId ?? state.currentPatientId);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const save = async () => {
    if (!file) return;
    setBusy(true);
    let dataUrl: string | undefined;
    if (file.size <= MAX_INLINE) {
      dataUrl = await new Promise<string>((res) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.readAsDataURL(file);
      });
    }
    const u: Upload = {
      id: uid("u"),
      patientId: pid,
      name: file.name,
      kind,
      date: todayStr(),
      mime: file.type || "application/octet-stream",
      size: file.size,
      dataUrl,
      note: note || undefined,
    };
    const pname = state.patients.find((p) => p.id === pid)?.name;
    update((d) => {
      d.uploads.unshift(u);
      notify(d, { to: "doctor", text: `${pname} uploaded a new ${KIND_LABEL[kind].toLowerCase()}: ${file.name}` });
    });
    onUploaded?.(u);
    setBusy(false);
    setFile(null);
    setNote("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Upload prescription or report">
      <div className="space-y-4">
        <div
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
          }}
          className={cx(
            "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center",
            drag ? "border-brand-600 bg-brand-50" : "border-slate-300 hover:bg-slate-50",
          )}
        >
          {file ? (
            <>
              <FileUp className="mb-2 text-brand-700" />
              <div className="text-sm font-medium">{file.name}</div>
              <div className="text-xs text-slate-500">{(file.size / 1024).toFixed(0)} KB · tap to change</div>
            </>
          ) : (
            <>
              <UploadCloud className="mb-2 text-slate-400" size={32} />
              <div className="text-sm font-medium">Tap to take a photo or choose a file</div>
              <div className="text-xs text-slate-500">JPG, PNG or PDF</div>
            </>
          )}
          <input
            ref={input}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="For">
            <select className={inputCls} value={pid} onChange={(e) => setPid(e.target.value)}>
              {fam.map((id) => {
                const p = state.patients.find((x) => x.id === id)!;
                return (
                  <option key={id} value={id}>
                    {p.name}
                    {p.relation ? ` (${p.relation})` : ""}
                  </option>
                );
              })}
            </select>
          </Field>
          <Field label="Type">
            <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value as UploadKind)}>
              {Object.entries(KIND_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Note for the doctor (optional)">
          <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Sugar report from last week" />
        </Field>
        <Button className="w-full" size="lg" disabled={!file || busy} onClick={save}>
          {busy ? "Uploading…" : "Upload"}
        </Button>
        <p className="text-center text-xs text-slate-500">Demo: files stay in this browser only.</p>
      </div>
    </Modal>
  );
}
