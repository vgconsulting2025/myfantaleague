import type { LeagueTeam } from "@/lib/league/types";
import { SectionTitle } from "./ui";

export default function Classifica({ standings }: { standings: LeagueTeam[] }) {
  return (
    <div>
      <SectionTitle overline="Lega Bar Centrale" title="Classifica" />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[3rem_1fr_auto] items-center gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span className="text-center">#</span>
          <span>Squadra</span>
          <span>Punti</span>
        </div>
        <ul>
          {standings.map((t, i) => (
            <li
              key={t.id}
              className={`grid grid-cols-[3rem_1fr_auto] items-center gap-4 border-b border-slate-100 px-5 py-3 last:border-b-0 ${
                t.isUser ? "bg-verde-50" : ""
              }`}
            >
              <span
                className={`text-center font-display text-2xl font-bold ${
                  i === 0 ? "text-verde" : "text-slate-400"
                }`}
              >
                {i + 1}
              </span>
              <span>
                <span className="flex items-center gap-2">
                  <span className="font-display text-lg font-semibold text-slate-900">
                    {t.name}
                  </span>
                  {t.isUser && (
                    <span className="rounded-full bg-verde px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      La tua squadra
                    </span>
                  )}
                </span>
                <span className="block text-xs uppercase tracking-wide text-slate-400">
                  Presidente: {t.president}
                </span>
              </span>
              <span className="font-display text-2xl font-bold tabular-nums text-slate-900">
                {t.points}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-4 text-sm italic text-slate-400">
        Lega dimostrativa — nel prodotto finale rose e risultati arrivano dalla piattaforma di
        gioco. Usa &ldquo;Simula giornata&rdquo; nell&apos;header per far girare il campionato.
      </p>
    </div>
  );
}
