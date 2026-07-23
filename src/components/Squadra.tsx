"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { LeaguePlayer, LeagueTeam } from "@/lib/league/types";
import { canChangeIdol, partitionIdol, idolLevelInfo, IDOL_LEVEL_META } from "@/lib/league/idol";
import { ROLE_LABELS, ROLE_ORDER } from "./theme";
import { RoleBadge } from "./ui";
import Figurina from "./figurine/Figurina";
import CeremonyModal from "./figurine/CeremonyModal";
import PlayerThumb from "./figurine/PlayerThumb";
import TeamCrest from "./brand/TeamCrest";

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="font-display text-4xl font-bold text-slate-900">{value}</div>
      <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}

function ViewToggle({ view, setView }: { view: "grid" | "list"; setView: (v: "grid" | "list") => void }) {
  return (
    <div className="inline-flex overflow-hidden rounded-xl border border-slate-200 bg-white text-sm font-semibold">
      {(["grid", "list"] as const).map((v) => (
        <button
          key={v}
          onClick={() => setView(v)}
          className={`px-3 py-2 transition ${view === v ? "bg-verde text-white" : "text-slate-600 hover:bg-slate-50"}`}
        >
          {v === "grid" ? "Figurine" : "Elenco"}
        </button>
      ))}
    </div>
  );
}

// Pulsante corona: apre la cerimonia di incoronazione per il giocatore.
// Disabilitato se il cambio non è ancora consentito (vincolo 1/giornata).
function IdolCrownButton({
  player,
  canChange,
  onOpen,
}: {
  player: LeaguePlayer;
  canChange: boolean;
  onOpen: (p: LeaguePlayer) => void;
}) {
  return (
    <button
      onClick={() => onOpen(player)}
      disabled={!canChange}
      title={
        canChange
          ? "Incorona come idolo della squadra"
          : "Potrai cambiare idolo dopo la prossima giornata"
      }
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200 transition hover:text-oro-700 hover:ring-oro disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span aria-hidden>♛</span> Incorona
    </button>
  );
}

// Podio "Il tuo Idolo": posizione d'onore in alto, con la figurina più grande su
// uno sfondo distintivo (diverso dai badge di livello e dalla variante "rara").
function IdolPodium({ idol }: { idol: LeaguePlayer }) {
  const info = idol.idolProgress ? idolLevelInfo(idol.idolProgress) : null;
  return (
    <section className="relative mb-8 overflow-hidden rounded-3xl bg-verde-900 p-6 text-white shadow-lg ring-1 ring-oro/30">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{ background: "radial-gradient(120% 90% at 28% -10%, rgba(212,175,55,0.20), transparent 60%)" }}
      />
      <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <Figurina player={idol} size="lg" href={`/figurina/${idol.id}`} />
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-oro-200">Il tuo Idolo</div>
          <h3 className="mt-1 truncate font-display text-3xl font-bold text-oro">{idol.name}</h3>
          <div className="text-sm text-white/70">
            {ROLE_LABELS[idol.role]} · {idol.club || "—"} · FM {idol.fm.toFixed(1)}
          </div>
          {info && idol.idolProgress && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="rounded-full bg-oro px-3 py-1 text-xs font-bold uppercase tracking-wide text-verde-900">
                Livello {IDOL_LEVEL_META[info.level].label}
              </span>
              <span className="text-xs text-white/70">
                Fedeltà {idol.idolProgress.streak} giornate · Migliore in campo {idol.idolProgress.bestCount} ·
                Fantamedia cumulata {idol.idolProgress.cumFm.toFixed(1)}
              </span>
            </div>
          )}
          <p className="mt-3 text-xs text-white/50">
            Cambia idolo con la corona ♛ sulle figurine qui sotto (una volta a giornata).
          </p>
        </div>
      </div>
    </section>
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
  const [ceremonyPlayer, setCeremonyPlayer] = useState<LeaguePlayer | null>(null);
  const [ceremonyBusy, setCeremonyBusy] = useState(false);
  const [ceremonyError, setCeremonyError] = useState<string | null>(null);

  const players = userTeam.players;
  const { idol, others } = partitionIdol(players);
  const canChange = canChangeIdol(
    userTeam.idolPlayerId ?? null,
    userTeam.idolSetGiornata ?? null,
    latestGiornataNumber,
  );

  function openCeremony(p: LeaguePlayer) {
    setCeremonyError(null);
    setCeremonyPlayer(p);
  }
  function closeCeremony() {
    if (ceremonyBusy) return;
    setCeremonyPlayer(null);
    setCeremonyError(null);
  }
  async function confirmCeremony() {
    if (!ceremonyPlayer) return;
    setCeremonyBusy(true);
    setCeremonyError(null);
    try {
      const res = await fetch("/api/idol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: ceremonyPlayer.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Impossibile incoronare l'idolo.");
      setCeremonyPlayer(null);
      startTransition(() => router.refresh());
    } catch (e) {
      setCeremonyError(e instanceof Error ? e.message : "Errore.");
    } finally {
      setCeremonyBusy(false);
    }
  }

  const totalQuota = players.reduce((s, p) => s + p.quota, 0);
  const avgFm = players.length
    ? (players.reduce((s, p) => s + p.fm, 0) / players.length).toFixed(2)
    : "0.00";

  // Statistiche reparti su TUTTA la rosa (idolo incluso).
  const reparti = ROLE_ORDER.map((role) => {
    const ps = players.filter((p) => p.role === role);
    const avg = ps.length ? ps.reduce((s, p) => s + p.fm, 0) / ps.length : 0;
    return { role, count: ps.length, avg };
  }).filter((r) => r.count > 0);
  const strongest = reparti.reduce((a, b) => (b.avg > a.avg ? b : a), reparti[0]);
  const weakest = reparti.reduce((a, b) => (b.avg < a.avg ? b : a), reparti[0]);

  // Griglia: l'idolo è nel podio, non qui (nessun duplicato).
  const gridReparti = ROLE_ORDER.map((role) => ({
    role,
    players: others.filter((p) => p.role === role),
  })).filter((r) => r.players.length > 0);

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

      {/* Podio "Il tuo Idolo" (posizione d'onore) */}
      {idol ? (
        <IdolPodium idol={idol} />
      ) : (
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-oro-200 bg-oro-50/50 px-4 py-3">
          <span className="text-oro" aria-hidden>
            ♛
          </span>
          <span className="text-sm font-semibold text-verde-900">Nessun idolo designato</span>
          <span className="text-xs text-slate-500">
            · Scegline uno con la corona ♛ sulle figurine qui sotto.
          </span>
        </div>
      )}
      {idol && !canChange && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-700">
          Potrai cambiare idolo dopo la prossima giornata (una modifica per giornata).
        </div>
      )}

      {/* Punti di forza / reparti scoperti (calcolo locale) */}
      {strongest && weakest && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-verde-200 bg-verde-50 p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-verde-700">Punto di forza</div>
            <div className="mt-1 font-display text-2xl font-bold text-verde-900">{ROLE_LABELS[strongest.role]}</div>
            <div className="text-sm text-verde-700">
              Fantamedia media {strongest.avg.toFixed(2)} · {strongest.count} giocatori
            </div>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">Reparto più scoperto</div>
            <div className="mt-1 font-display text-2xl font-bold text-amber-900">{ROLE_LABELS[weakest.role]}</div>
            <div className="text-sm text-amber-800">
              Fantamedia media {weakest.avg.toFixed(2)} · {weakest.count} giocatori
            </div>
          </div>
        </div>
      )}

      {/* Rosa per ruolo (idolo escluso: è nel podio) */}
      {gridReparti.map((r) => (
        <div key={r.role} className="mb-8">
          <div className="mb-3 flex items-center gap-2 border-b-2 border-slate-900 pb-1">
            <RoleBadge role={r.role} />
            <span className="font-display text-lg font-semibold uppercase tracking-wide text-slate-800">
              {ROLE_LABELS[r.role]}
            </span>
            <span className="text-xs font-medium text-slate-400">· {r.players.length} giocatori</span>
          </div>

          {view === "grid" ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {r.players.map((p) => (
                <div key={p.id} className="flex flex-col items-center gap-2">
                  <Figurina player={p} size="md" href={`/figurina/${p.id}`} />
                  <IdolCrownButton player={p} canChange={canChange} onOpen={openCeremony} />
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
                    <IdolCrownButton player={p} canChange={canChange} onOpen={openCeremony} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}

      {/* Cerimonia di incoronazione */}
      {ceremonyPlayer && (
        <CeremonyModal
          player={ceremonyPlayer}
          isChange={!!idol}
          busy={ceremonyBusy}
          error={ceremonyError}
          onConfirm={confirmCeremony}
          onClose={closeCeremony}
        />
      )}
    </div>
  );
}
