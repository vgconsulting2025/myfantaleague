"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function FigurinaUploader({
  playerId,
  hasImage,
}: {
  playerId: string;
  hasImage: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/players/${playerId}/image`, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload non riuscito.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/players/${playerId}/image`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Rimozione non riuscita.");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-verde">
        Immagine personalizzata
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
          }}
          className="block text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-verde file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-verde-700"
        />
        {hasImage && (
          <button
            onClick={remove}
            disabled={busy}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
          >
            Rimuovi immagine
          </button>
        )}
      </div>
      {busy && <p className="mt-2 text-sm text-slate-500">Attendere…</p>}
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      <p className="mt-2 text-xs text-slate-400">
        PNG, JPG o WebP, max 2 MB. Sostituisce l&apos;avatar generato ovunque compaia il giocatore.
        Il contenuto caricato è responsabilità dell&apos;utente.
      </p>
    </div>
  );
}
