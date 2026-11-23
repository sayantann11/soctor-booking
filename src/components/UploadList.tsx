"use client";

import { useState } from "react";
import { FileImage, FileText, Eye, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Upload } from "@/lib/types";
import { shortDate } from "@/lib/time";
import { Badge, Card, Modal } from "./ui";
import { KIND_LABEL } from "./UploadDialog";

export function UploadList({ uploads, canDelete, showWho }: { uploads: Upload[]; canDelete?: boolean; showWho?: boolean }) {
  const { state, update } = useStore();
  const [view, setView] = useState<Upload | null>(null);
  if (!uploads.length) return <Card className="p-4 text-sm text-slate-500">No files uploaded yet.</Card>;
  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2">
        {uploads.map((u) => (
          <Card key={u.id} className="flex items-center gap-3 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              {u.mime.startsWith("image") ? <FileImage size={20} /> : <FileText size={20} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{u.name}</div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                <Badge tone="teal">{KIND_LABEL[u.kind]}</Badge>
                {showWho && <span>{state.patients.find((p) => p.id === u.patientId)?.name.split(" ")[0]} ·</span>}
                <span>{shortDate(u.date)} · {(u.size / 1024).toFixed(0)} KB</span>
              </div>
              {u.note && <div className="mt-0.5 truncate text-xs text-slate-500">{u.note}</div>}
            </div>
            <button onClick={() => setView(u)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="View">
              <Eye size={18} />
            </button>
            {canDelete && (
              <button
                onClick={() => confirm("Delete this file?") && update((d) => { d.uploads = d.uploads.filter((x) => x.id !== u.id); })}
                className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                aria-label="Delete"
              >
                <Trash2 size={18} />
              </button>
            )}
          </Card>
        ))}
      </div>
      <Modal open={!!view} onClose={() => setView(null)} title={view?.name ?? ""} wide>
        {view &&
          (view.dataUrl ? (
            view.mime.startsWith("image") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={view.dataUrl} alt={view.name} className="w-full rounded-xl" />
            ) : view.mime === "application/pdf" ? (
              <iframe src={view.dataUrl} className="h-[70vh] w-full rounded-xl" title={view.name} />
            ) : (
              <a href={view.dataUrl} download={view.name} className="text-brand-700">Download file</a>
            )
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-xl bg-slate-50 text-center text-sm text-slate-500">
              <FileText size={40} className="mb-2 text-slate-300" />
              Sample file — preview not available in the demo.
              <br />Upload your own file to see the preview.
            </div>
          ))}
      </Modal>
    </>
  );
}
