"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { LeaguePlayer, LeagueTeam } from "@/lib/league/types";
import { canChangeIdol } from "@/lib/league/idol";
import { ROLE_LABELS, ROLE_ORDER } from "./theme";
import { RoleBadge } from "./ui";
import Figurina from "./figurine/Figurina";
import PlayerThumb from "./figurine/PlayerThumb";
import TeamCrest from "./brand/TeamCrest";

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="font-display text-4xl font-bold text-slate-900">{value}</div>
      <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
    </div>
  );
}

function ViewToggle({
  view,
  setView,
}: {
  view: "grid" | "list";
  setView: (v: "grid" | "list") => void;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-xl border border-slate-200 bg-white text-sm font-semibold">
      {(["grid", "list"] as const).map((v) => (
        <button
          key={v}
          onClick={() => setView(v)}
          className={`px-3 py-2 transition ${
            view === v ? "bg-verde text-white" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          {v === "grid" ? "Figurine" : "Elenco"}
        </button>
      ))}
    </div>
  );
}

// Stella per designare l'idolo. Se il giocatore è già idolo mostra il badge
// attivo; altrimenti un pulsante (disabilitato se il cambio non è ancora
// consentito per il vincolo di una modifica a giornata).
function IdolStar({
  player,
  canChange,
  busy,
  onDesignate,
}: {
  player: LeaguePlayer;
  canChange: boolean;
  busy: boolean;
  onDesignate: (id: string) => void;
}) {
  if (player.isIdol) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-oro/20 px-2.5 py-1 text-xs font-bold text-oro-800 ring-1 ring-oro">
        <span aria-hidden>★</span> Idolo
      </span>
    );
  }
  return (
    <button
      onClick={() => onDesignate(player.id)}
      disabled={busy || !canChange}
      title={
        canChange
          ? "Designa come idolo della squadra"
          : "Potrai cambiare idolo dopo la prossima giornata"
      }
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200 transition hover:text-oro-700 hover:ring-oro disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span aria-hidden>☆</span> {busy ? "..." : "Idolo"}
    </button>
  );
}

export default function Squadra({
  userTeam,
  latestGiornataNumber,
}: {
  userTeam: LeagueTeam;
  latestGiornataNumber: number;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [idolError, setIdolError] = useState<string | null>(null);
  const players = userTeam.players;
  const idol = players.find((p) => p.isIdol) ?? null;
  const canChange = canChangeIdol(
    userTeam.idolPlayerId ?? null,
    userTeam.idolSetGiornata ?? null,
    latestGiornataNumber,
  );

  async function designate(playerId: string) {
    setBusyId(playerId);
    setIdolError(null);
    try {
      const res = await fetch("/api/idol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Impossibile designare l'idolo.");
      startTransition(() => router.refresh());
    } catch (e) {
      setIdolError(e instanceof Error ? e.message : "Errore.");
    } finally {
      setBusyId(null);
    }
  }
  const totalQuota = players.reduce((s, p) => s + p.quota, 0);
  const avgFm = players.length
    ? (players.reduce((s, p) => s + p.fm, 0) / players.length).toFixed(2)
    : "0.00";

  const reparti = ROLE_ORDER.map((role) => {
    const ps = players.filter((p) => p.role === role);
    const avg = ps.length ? ps.reduce((s, p) => s + p.fm, 0) / ps.length : 0;
    return { role, count: ps.length, avg, players: ps };
  }).filter((r) => r.count > 0);

  const strongest = reparti.reduce((a, b) => (b.avg > a.avg ? b : a), reparti[0]);
  const weakest = reparti.reduce((a, b) => (b.avg < a.avg ? b : a), reparti[0]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
            <TeamCrest crestUrl={userTeam.crestUrl} className="h-full w-full" />
          </span>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-verde">
              Gestione squadra · {userTeam.president}
            </div>
            <h2 className="font-display text-3xl font-bold text-slate-900">{userTeam.name}</h2>
          </div>
        </div>
        <ViewToggle view={view} setView={setView} />
      </div>

      {/* Statistiche di sintesi */}
      <div className="mb-5 flex flex-wrap gap-4">
        <StatCard value={String(totalQuota)} label="Valore rosa (crediti)" />
        <StatCard value={avgFm} label="Fantamedia squadra" />
        <StatCard value={String(userTeam.points)} label="Punti in classifica" />
      </div>

      {/* Punti di forza / reparti scoperti (calcolo locale) */}
      {strongest && weakest && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-verde-200 bg-verde-50 p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-verde-700">
              Punto di forza
            </div>
            <div className="mt-1 font-display text-2xl font-bold text-verde-900">
              {ROLE_LABELS[strongest.role]}
            </div>
            <div className="text-sm text-verde-700">
              Fantamedia media {strongest.avg.toFixed(2)} · {strongest.count} giocatori
            </div>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              Reparto più scoperto
            </div>
            <div className="mt-1 font-display text-2xl font-bold text-amber-900">
              {ROLE_LABELS[weakest.role]}
            </div>
            <div className="text-sm text-amber-800">
              Fantamedia media {weakest.avg.toFixed(2)} · {weakest.count} giocatori
            </div>
          </div>
        </div>
      )}

      {/* Idolo della squadra */}
      <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl border border-oro-200 bg-oro-50/50 px-4 py-3">
        <span className="text-oro" aria-hidden>
          ★
        </span>
        <span className="text-sm font-semibold text-verde-900">
          Idolo della squadra: {idol ? idol.name : "nessuno"}
        </span>
        <span className="text-xs text-slate-500">
          · Designalo con la stella sulla figurina. Puoi cambiarlo una volta a giornata.
        </span>
        {!canChange && (
          <span className="text-xs font-medium text-amber-700">
            · Cambio disponibile dopo la prossima giornata.
          </span>
        )}
      </div>
      {idolError && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {idolError}
        </div>
      )}

      {/* Rosa per ruolo */}
      {reparti.map((r) => (
        <div key={r.role} className="mb-8">
          <div className="mb-3 flex items-center gap-2 border-b-2 border-slate-900 pb-1">
            <RoleBadge role={r.role} />
            <span className="font-display text-lg font-semibold uppercase tracking-wide text-slate-800">
              {ROLE_LABELS[r.role]}
            </span>
            <span className="text-xs font-medium text-slate-400">· {r.count} giocatori</span>
          </div>

          {view === "grid" ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {r.players.map((p) => (
                <div key={p.id} className="flex flex-col items-center gap-2">
                  <Figurina player={p} size="md" href={`/figurina/${p.id}`} />
                  <IdolStar
                    player={p}
                    canChange={canChange}
                    busy={busyId === p.id}
                    onDesignate={designate}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <ul className="divide-y divide-slate-100">
                {r.players.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-4 py-2">
                    <Link
                      href={`/figurina/${p.id}`}
                      className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50 ring-1 ring-slate-200 transition hover:ring-verde-500"
                      title={`Figurina di ${p.name}`}
                    >
                      <PlayerThumb player={p} className="h-full w-full" />
                    </Link>
                    <span className="flex-1 text-sm">
                      <span className="font-semibold text-slate-900">{p.name}</span>
                      <span className="text-slate-400"> · {p.club}</span>
                    </span>
                    <span className="text-xs text-slate-500">quota {p.quota}</span>
                    <span
                      className={`w-14 text-right text-sm font-bold tabular-nums ${
                        p.fm >= 6.8 ? "text-verde" : "text-slate-700"
                      }`}
                    >
                      FM {p.fm.toFixed(1)}
                    </span>
                    <IdolStar
                      player={p}
                      canChange={canChange}
                      busy={busyId === p.id}
                      onDesignate={designate}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
