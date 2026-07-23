"use client";

import { useState } from "react";
import type { LeaguePlayer } from "@/lib/league/types";
import { idolLevelInfo, IDOL_LEVEL_META } from "@/lib/league/idol";
import Figurina from "./Figurina";

const LEVEL_CHIP: Record<number, { chip: string; icon: string }> = {
  1: { chip: "bg-[#6e4320] text-[#f5ddc6]", icon: "★" },
  2: { chip: "bg-[#586471] text-white", icon: "★★" },
  3: { chip: "bg-verde-900 text-verde-50", icon: "★★★" },
  4: { chip: "bg-[#06120c] text-oro", icon: "♔" },
};

function ProgressStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-oro-200">
      <div className="font-display text-2xl font-bold text-verde-900">{value}</div>
      <div className="mt-0.5 text-[10px] font-semibold uppercase leading-tight tracking-wide text-slate-500">
        {label}
      </div>
    </div>
  );
}

// Figurina ingrandita con toggle fronte/retro della maglia (se disponibile e
// se il giocatore non ha una foto propria caricata) e, per l'idolo, un pannello
// coi progressi accumulati giornata dopo giornata.
export default function FigurinaViewer({ player }: { player: LeaguePlayer }) {
  const [back, setBack] = useState(false);
  const canToggle =
    !player.imageUrl && !!player.owner?.jerseyFrontUrl && !!player.owner?.jerseyBackUrl;
  const progress = player.isIdol ? player.idolProgress : null;
  // Leggenda: breve momento celebrativo all'apertura (una tantum al montaggio),
  // poi la card si stabilizza nell'aspetto a riposo (glow + scintille).
  const isLegend = !!player.isIdol && player.idolProgress?.level === 4;

  return (
    <div className="flex w-full max-w-[300px] flex-col items-center gap-3">
      <div className={isLegend ? "idol-celebrate" : ""}>
        <Figurina player={player} size="lg" showBack={back} />
      </div>
      {canToggle && (
        <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 text-sm font-semibold">
          <button
            onClick={() => setBack(false)}
            className={`px-3 py-1.5 transition ${!back ? "bg-verde text-white" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Fronte
          </button>
          <button
            onClick={() => setBack(true)}
            className={`px-3 py-1.5 transition ${back ? "bg-verde text-white" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Retro
          </button>
        </div>
      )}

      {progress && (
        <div className="w-full rounded-2xl border border-oro-200 bg-oro-50/50 p-4 shadow-sm">
          {(() => {
            const info = idolLevelInfo({
              cumFm: progress.cumFm,
              bestCount: progress.bestCount,
              streak: progress.streak,
            });
            const chip = LEVEL_CHIP[info.level];
            return (
              <>
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-verde-900">
                    <span className="text-oro" aria-hidden>
                      ★
                    </span>
                    Idolo{player.owner?.name ? ` di ${player.owner.name}` : ""}
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${chip.chip}`}
                  >
                    <span aria-hidden>{chip.icon}</span> {IDOL_LEVEL_META[info.level].label}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <ProgressStat value={progress.cumFm.toFixed(1)} label="Fantamedia cumulata" />
                  <ProgressStat value={String(progress.bestCount)} label="Migliore in campo" />
                  <ProgressStat value={String(progress.streak)} label="Giornate da idolo" />
                </div>

                {/* Avanzamento verso il prossimo livello */}
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-[11px] font-medium text-slate-500">
                    <span>Livello {IDOL_LEVEL_META[info.level].label}</span>
                    <span>
                      {info.next ? `Prossimo: ${IDOL_LEVEL_META[info.next].label}` : "Massimo livello"}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white ring-1 ring-oro-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-oro to-oro-600 transition-all"
                      style={{ width: `${Math.round(info.progress * 100)}%` }}
                    />
                  </div>
                </div>

                {progress.quote && (
                  <p className="mt-3 border-t border-oro-200 pt-2 text-sm italic text-verde-900">
                    «{progress.quote}»
                  </p>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
