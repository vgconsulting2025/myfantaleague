"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { LeagueTeam } from "@/lib/league/types";
import { resolveTeamColors } from "@/lib/league/identity";
import { canChangeRival } from "@/lib/league/rival";
import { SectionTitle } from "./ui";
import TeamCrest from "./brand/TeamCrest";

function colorsOf(t: LeagueTeam) {
  return resolveTeamColors({
    name: t.name,
    crestUrl: t.crestUrl ?? null,
    jerseyFrontUrl: t.jerseyFrontUrl ?? null,
    jerseyBackUrl: t.jerseyBackUrl ?? null,
    color1: t.color1 ?? null,
    color2: t.color2 ?? null,
  });
}

function DerbyStat({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div className="rounded-xl bg-white p-3 text-center shadow-sm ring-1 ring-rose-100">
      <div className={`font-display text-3xl font-bold ${tone}`}>{value}</div>
      <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}

// Scheda "Rivalità storica": squadra dell'utente vs rivale + storico dei derby.
function RivalCard({ userTeam, rival }: { userTeam: LeagueTeam; rival: LeagueTeam }) {
  const r = userTeam.rivalRecord;
  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-5 shadow-sm">
      <div className="text-xs font-bold uppercase tracking-[0.25em] text-rose-600">Rivalità storica</div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-3 sm:gap-6">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
            <TeamCrest crestUrl={userTeam.crestUrl} className="h-full w-full" />
          </span>
          <span className="font-display text-lg font-bold text-slate-900">{userTeam.name}</span>
        </div>
        <span className="font-display text-xl font-black text-rose-500">VS</span>
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
            <TeamCrest crestUrl={rival.crestUrl} className="h-full w-full" />
          </span>
          <span className="font-display text-lg font-bold text-slate-900">{rival.name}</span>
        </div>
      </div>

      {r && (
        <>
          <div className="mx-auto mt-4 grid max-w-md grid-cols-3 gap-3">
            <DerbyStat value={r.wins} label="Vittorie" tone="text-verde" />
            <DerbyStat value={r.draws} label="Pareggi" tone="text-slate-500" />
            <DerbyStat value={r.losses} label="Sconfitte" tone="text-rose-600" />
          </div>
          <div className="mt-3 text-center text-sm text-slate-600">
            {r.derbies === 0 ? (
              <>Nessun derby ancora giocato: si accende alla prossima sfida diretta.</>
            ) : (
              <>
                {r.derbies} derby giocati · punteggio totale{" "}
                <span className="font-semibold text-slate-800">
                  {r.pointsFor.toFixed(1)} - {r.pointsAgainst.toFixed(1)}
                </span>
              </>
            )}
          </div>
        </>
      )}
      <p className="mt-2 text-center text-xs text-slate-400">
        Cambia rivale con ⚔ in classifica (una volta a giornata).
      </p>
    </section>
  );
}

export default function Classifica({
  standings,
  latestGiornataNumber,
}: {
  standings: LeagueTeam[];
  latestGiornataNumber: number;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rivalError, setRivalError] = useState<string | null>(null);

  const userTeam = standings.find((t) => t.isUser) ?? null;
  const rivalId = userTeam?.rivalTeamId ?? null;
  const rival = rivalId ? standings.find((t) => t.id === rivalId) ?? null : null;
  const canChange = canChangeRival(rivalId, userTeam?.rivalSetGiornata ?? null, latestGiornataNumber);

  async function chooseRival(teamId: string) {
    setBusyId(teamId);
    setRivalError(null);
    try {
      const res = await fetch("/api/rival", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Impossibile scegliere il rivale.");
      startTransition(() => router.refresh());
    } catch (e) {
      setRivalError(e instanceof Error ? e.message : "Errore.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <SectionTitle overline="Lega Bar Centrale" title="Classifica" />

      {/* Scheda rivalità storica */}
      {userTeam && rival ? (
        <RivalCard userTeam={userTeam} rival={rival} />
      ) : (
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/60 px-4 py-3">
          <span className="text-rose-500" aria-hidden>
            ⚔
          </span>
          <span className="text-sm font-semibold text-slate-800">Nessun rivale storico scelto</span>
          <span className="text-xs text-slate-500">· Scegline uno con ⚔ nella classifica qui sotto.</span>
        </div>
      )}
      {rivalError && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {rivalError}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[2.5rem_1fr_auto_5.5rem] items-center gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span className="text-center">#</span>
          <span>Squadra</span>
          <span>Punti</span>
          <span className="text-center">Rivale</span>
        </div>
        <ul>
          {standings.map((t, i) => {
            const colors = colorsOf(t);
            const isRival = t.id === rivalId;
            return (
              <li
                key={t.id}
                className={`grid grid-cols-[2.5rem_1fr_auto_5.5rem] items-center gap-3 border-b border-slate-100 px-5 py-3 last:border-b-0 ${
                  t.isUser ? "bg-verde-50" : isRival ? "bg-rose-50/50" : ""
                }`}
                style={{ borderLeft: `4px solid ${colors.primary}` }}
              >
                <span className={`text-center font-display text-2xl font-bold ${i === 0 ? "text-verde" : "text-slate-400"}`}>
                  {i + 1}
                </span>
                <span>
                  <span className="flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-50 ring-1 ring-slate-200">
                      <TeamCrest crestUrl={t.crestUrl} className="h-full w-full" />
                    </span>
                    <span className="font-display text-lg font-semibold text-slate-900">{t.name}</span>
                    {t.isUser && (
                      <span className="rounded-full bg-verde px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        La tua squadra
                      </span>
                    )}
                    {isRival && (
                      <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        Rivale
                      </span>
                    )}
                  </span>
                  <span className="block text-xs uppercase tracking-wide text-slate-400">Presidente: {t.president}</span>
                </span>
                <span className="font-display text-2xl font-bold tabular-nums text-slate-900">{t.points}</span>
                <span className="flex justify-center">
                  {t.isUser ? (
                    <span className="text-xs text-slate-300">—</span>
                  ) : isRival ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700 ring-1 ring-rose-300">
                      <span aria-hidden>⚔</span> Rivale
                    </span>
                  ) : (
                    <button
                      onClick={() => chooseRival(t.id)}
                      disabled={busyId === t.id || !canChange}
                      title={canChange ? "Scegli come rivale storico" : "Potrai cambiare rivale dopo la prossima giornata"}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200 transition hover:text-rose-600 hover:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span aria-hidden>⚔</span> {busyId === t.id ? "..." : "Rivale"}
                    </button>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="mt-4 text-sm italic text-slate-400">
        Lega dimostrativa — nel prodotto finale rose e risultati arrivano dalla piattaforma di gioco.
        Usa &ldquo;Simula giornata&rdquo; nell&apos;header per far girare il campionato.
      </p>
    </div>
  );
}
