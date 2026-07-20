import type { LeagueTeam } from "@/lib/league/types";
import { ROLE_LABELS, ROLE_ORDER } from "./theme";
import { RoleBadge, SectionTitle } from "./ui";

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

export default function Squadra({ userTeam }: { userTeam: LeagueTeam }) {
  const players = userTeam.players;
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
      <SectionTitle overline={`Gestione squadra · ${userTeam.president}`} title={userTeam.name} />

      {/* Statistiche di sintesi */}
      <div className="mb-5 flex flex-wrap gap-4">
        <StatCard value={String(totalQuota)} label="Valore rosa (crediti)" />
        <StatCard value={avgFm} label="Fantamedia squadra" />
        <StatCard value={String(userTeam.points)} label="Punti in classifica" />
      </div>

      {/* Punti di forza / reparti scoperti (calcolo locale) */}
      {strongest && weakest && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Punto di forza
            </div>
            <div className="mt-1 font-display text-2xl font-bold text-emerald-900">
              {ROLE_LABELS[strongest.role]}
            </div>
            <div className="text-sm text-emerald-800">
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

      {/* Rosa raggruppata per ruolo */}
      <div className="grid gap-5 md:grid-cols-2">
        {reparti.map((r) => (
          <div
            key={r.role}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
              <div className="flex items-center gap-2">
                <RoleBadge role={r.role} />
                <span className="font-display text-lg font-semibold uppercase tracking-wide text-slate-800">
                  {ROLE_LABELS[r.role]}
                </span>
              </div>
              <span className="text-xs font-medium text-slate-400">{r.count} giocatori</span>
            </div>
            <ul className="divide-y divide-slate-100">
              {r.players.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-5 py-2.5">
                  <span className="flex-1 text-sm">
                    <span className="font-semibold text-slate-900">{p.name}</span>
                    <span className="text-slate-400"> · {p.club}</span>
                  </span>
                  <span className="text-xs text-slate-500">quota {p.quota}</span>
                  <span
                    className={`w-14 text-right text-sm font-bold tabular-nums ${
                      p.fm >= 6.8 ? "text-emerald-600" : "text-slate-700"
                    }`}
                  >
                    FM {p.fm.toFixed(1)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
