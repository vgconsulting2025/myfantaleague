"use client";

import { useState } from "react";
import type { LeaguePlayer } from "@/lib/league/types";
import Figurina from "./Figurina";

// Figurina ingrandita con toggle fronte/retro della maglia (se disponibile e
// se il giocatore non ha una foto propria caricata).
export default function FigurinaViewer({ player }: { player: LeaguePlayer }) {
  const [back, setBack] = useState(false);
  const canToggle =
    !player.imageUrl && !!player.owner?.jerseyFrontUrl && !!player.owner?.jerseyBackUrl;

  return (
    <div className="flex flex-col items-center gap-3">
      <Figurina player={player} size="lg" showBack={back} />
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
    </div>
  );
}
