"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { LeagueTeam, LeaguePlayer, TeamIdentity } from "@/lib/league/types";
import { COLOR_PRESETS } from "@/lib/league/identity";
import Figurina from "./figurine/Figurina";
import TeamCrest from "./brand/TeamCrest";

type Kind = "crest" | "jerseyFront" | "jerseyBack";

function AssetRow({
  label,
  kind,
  currentUrl,
  disabled,
  onChange,
}: {
  label: string;
  kind: Kind;
  currentUrl: string | null | undefined;
  disabled?: boolean;
  onChange: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("kind", kind);
      fd.append("file", file);
      const res = await fetch("/api/team/image", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload non riuscito.");
      onChange();
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
      const res = await fetch(`/api/team/image?kind=${kind}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Rimozione non riuscita.");
      }
      onChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={disabled ? "opacity-50" : ""}>
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={busy || disabled}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
          }}
          className="block text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-verde file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-verde-700"
        />
        {currentUrl && (
          <button
            onClick={remove}
            disabled={busy}
            className="text-xs font-semibold text-slate-500 hover:text-rose-600"
          >
            rimuovi
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}

export default function TeamIdentityEditor({ team }: { team: LeagueTeam }) {
  const router = useRouter();
  const [busyColors, setBusyColors] = useState(false);

  const identity: TeamIdentity = {
    name: team.name,
    crestUrl: team.crestUrl ?? null,
    jerseyFrontUrl: team.jerseyFrontUrl ?? null,
    jerseyBackUrl: team.jerseyBackUrl ?? null,
    color1: team.color1 ?? null,
    color2: team.color2 ?? null,
  };
  const refresh = () => router.refresh();

  const previewPlayer: LeaguePlayer = {
    id: "preview",
    name: "Esempio",
    role: "A",
    club: "",
    quota: 0,
    fm: 6,
    number: 10,
    imageUrl: null,
    owner: identity,
  };

  async function pickColors(color1: string | null, color2: string | null) {
    setBusyColors(true);
    try {
      const res = await fetch("/api/team/colors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(color1 ? { color1, color2 } : { reset: true }),
      });
      if (res.ok) refresh();
    } finally {
      setBusyColors(false);
    }
  }

  const selected = COLOR_PRESETS.find(
    (p) => p.color1 === team.color1 && p.color2 === team.color2,
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-display text-xl font-semibold text-slate-900">Identità della tua squadra</h3>
      <p className="mb-4 mt-1 text-sm text-slate-500">
        Carica stemma e maglia, oppure scegli i colori sociali. Se non carichi nulla, la squadra usa
        il logo e i colori dell&apos;app. Il contenuto caricato è responsabilità dell&apos;utente.
      </p>

      <div className="grid gap-6 md:grid-cols-[1fr_auto]">
        <div className="space-y-5">
          {/* Stemma */}
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-slate-50 ring-1 ring-slate-200">
              <TeamCrest crestUrl={identity.crestUrl} className="h-full w-full" />
            </span>
            <div className="flex-1">
              <AssetRow label="Stemma / logo" kind="crest" currentUrl={identity.crestUrl} onChange={refresh} />
            </div>
          </div>

          {/* Maglia */}
          <AssetRow
            label="Maglia — fronte"
            kind="jerseyFront"
            currentUrl={identity.jerseyFrontUrl}
            onChange={refresh}
          />
          <AssetRow
            label="Maglia — retro (facoltativo)"
            kind="jerseyBack"
            currentUrl={identity.jerseyBackUrl}
            disabled={!identity.jerseyFrontUrl}
            onChange={refresh}
          />

          {/* Colori sociali */}
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Colori sociali {identity.jerseyFrontUrl ? "(usati se non c'è la maglia)" : ""}
            </div>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((p) => {
                const active = selected?.name === p.name;
                return (
                  <button
                    key={p.name}
                    disabled={busyColors}
                    onClick={() => pickColors(p.color1, p.color2)}
                    title={p.name}
                    className={`flex items-center gap-1 rounded-lg border p-1 pr-2 text-xs font-medium transition ${
                      active ? "border-verde ring-2 ring-verde-200" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="flex overflow-hidden rounded-md">
                      <span className="h-5 w-5" style={{ background: p.color1 }} />
                      <span className="h-5 w-5" style={{ background: p.color2 }} />
                    </span>
                    {p.name}
                  </button>
                );
              })}
              <button
                disabled={busyColors}
                onClick={() => pickColors(null, null)}
                className={`rounded-lg border px-3 py-1 text-xs font-medium transition ${
                  !team.color1 ? "border-verde ring-2 ring-verde-200" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                Default app
              </button>
            </div>
          </div>
        </div>

        {/* Anteprima */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Anteprima</div>
          <Figurina player={previewPlayer} size="md" />
        </div>
      </div>
    </div>
  );
}
