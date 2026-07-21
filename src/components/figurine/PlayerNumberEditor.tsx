"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PlayerNumberEditor({
  playerId,
  current,
}: {
  playerId: string;
  current: number;
}) {
  const router = useRouter();
  const [n, setN] = useState(current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/players/${playerId}/number`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: n }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Salvataggio non riuscito.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-verde">Numero di maglia</div>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={99}
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          className="w-20 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-verde-500 focus:outline-none"
        />
        <button
          onClick={save}
          disabled={busy}
          className="rounded-lg bg-verde px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-verde-700 disabled:opacity-60"
        >
          Salva
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
