"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  CoachRatingItem,
  LeagueTeam,
  PeerVoteItem,
  PresidentStanding,
} from "@/lib/league/types";
import { ErrorBox, SectionTitle } from "./ui";
import { timeAgo } from "./format";

function fmt(n: number | null): string {
  return n === null ? "—" : n.toFixed(1);
}

function Badge({ text }: { text: string }) {
  const best = text.toLowerCase().includes("allenatore");
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
        best
          ? "bg-gradient-to-r from-amber-200 to-amber-400 text-amber-900"
          : "bg-orange-100 text-orange-800"
      }`}
    >
      {best ? "🏆" : "🪑"} {text}
    </span>
  );
}

export default function Voti({
  standings,
  peerVotes,
  coachRatings,
  userTeam,
}: {
  standings: PresidentStanding[];
  peerVotes: PeerVoteItem[];
  coachRatings: CoachRatingItem[];
  userTeam: LeagueTeam;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [drafts, setDrafts] = useState<Record<string, { score: number; comment: string }>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const labelByTeam = useMemo(
    () => new Map(standings.map((s) => [s.teamName, s.label])),
    [standings],
  );
  const others = standings.filter((s) => s.teamName !== userTeam.name);
  const comments = peerVotes.filter((v) => v.comment.trim() !== "");

  function refresh() {
    startTransition(() => router.refresh());
  }
  const draftFor = (team: string) => drafts[team] ?? { score: 6, comment: "" };
  const setDraft = (team: string, patch: Partial<{ score: number; comment: string }>) =>
    setDrafts((prev) => ({ ...prev, [team]: { ...draftFor(team), ...patch } }));

  async function vote(toTeam: string) {
    const d = draftFor(toTeam);
    setBusy(toTeam);
    setError(null);
    try {
      const res = await fetch("/api/president-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toTeam, score: d.score, comment: d.comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Voto non registrato.");
      setDrafts((prev) => ({ ...prev, [toTeam]: { score: 6, comment: "" } }));
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore.");
    } finally {
      setBusy(null);
    }
  }

  async function removeComment(id: string) {
    setBusy(id);
    try {
      const res = await fetch("/api/president-vote/hide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <SectionTitle overline="Voti agli allenatori" title="I presidenti sotto esame" />

      {error && <ErrorBox message={error} onRetry={undefined} />}

      {/* Classifica presidenti per media voto */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[2.5rem_1fr_4rem_4rem_4rem] items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          <span className="text-center">#</span>
          <span>Presidente</span>
          <span className="text-center">AI</span>
          <span className="text-center">Lega</span>
          <span className="text-center">Media</span>
        </div>
        {standings.map((s, i) => (
          <div
            key={s.teamName}
            className={`grid grid-cols-[2.5rem_1fr_4rem_4rem_4rem] items-center gap-2 border-b border-slate-100 px-4 py-3 last:border-b-0 ${
              s.isUser ? "bg-emerald-50" : ""
            }`}
          >
            <span
              className={`text-center font-display text-xl font-bold ${
                i === 0 ? "text-amber-500" : "text-slate-400"
              }`}
            >
              {i + 1}
            </span>
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-1.5">
                <span className="font-display text-base font-semibold text-slate-900">
                  {s.label}
                </span>
                {s.isUser && (
                  <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                    Tu
                  </span>
                )}
                {s.badges.map((b) => (
                  <Badge key={b} text={b} />
                ))}
              </span>
              <span className="block truncate text-xs text-slate-400">{s.teamName}</span>
            </span>
            <span className="text-center text-sm font-semibold tabular-nums text-slate-700">
              {fmt(s.aiAvg)}
            </span>
            <span className="text-center text-sm font-semibold tabular-nums text-slate-700">
              {fmt(s.peerAvg)}
            </span>
            <span className="text-center font-display text-lg font-bold tabular-nums text-emerald-700">
              {fmt(s.overall)}
            </span>
          </div>
        ))}
        <p className="px-4 py-2 text-[11px] italic text-slate-400">
          AI = media dei voti dell&apos;Agente · Lega = media dei voti degli altri presidenti.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Vota gli altri presidenti */}
        <section>
          <h3 className="mb-3 font-display text-lg font-semibold uppercase tracking-wide text-slate-700">
            Vota gli altri presidenti
          </h3>
          {others.length === 0 ? (
            <p className="text-sm text-slate-400">Nessun altro presidente da votare.</p>
          ) : (
            <div className="space-y-3">
              {others.map((s) => {
                const d = draftFor(s.teamName);
                return (
                  <div
                    key={s.teamName}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="font-display font-semibold text-slate-900">{s.label}</span>
                      <select
                        value={d.score}
                        onChange={(e) => setDraft(s.teamName, { score: Number(e.target.value) })}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-sm font-bold focus:border-emerald-400 focus:outline-none"
                      >
                        {Array.from({ length: 10 }, (_, k) => k + 1).map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        value={d.comment}
                        maxLength={140}
                        onChange={(e) => setDraft(s.teamName, { comment: e.target.value })}
                        placeholder="Commento goliardico (facoltativo)"
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-emerald-400 focus:outline-none"
                      />
                      <button
                        onClick={() => vote(s.teamName)}
                        disabled={busy === s.teamName}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                      >
                        Vota
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Voti recenti dell'Agente */}
          <h3 className="mb-3 mt-8 font-display text-lg font-semibold uppercase tracking-wide text-slate-700">
            Ultimi voti dell&apos;Agente
          </h3>
          {coachRatings.length === 0 ? (
            <p className="text-sm text-slate-400">
              Simula una giornata: l&apos;Agente voterà gli allenatori.
            </p>
          ) : (
            <ul className="space-y-2">
              {coachRatings.slice(0, 6).map((c) => (
                <li
                  key={c.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-display text-sm font-bold text-white ${
                      c.score >= 7 ? "bg-emerald-600" : c.score <= 4 ? "bg-rose-500" : "bg-slate-400"
                    }`}
                  >
                    {c.score}
                  </span>
                  <span className="text-sm">
                    <span className="font-semibold text-slate-900">
                      {c.president && c.president !== "—" ? c.president : c.teamName}
                    </span>
                    <span className="text-slate-400"> · G{c.giornata}</span>
                    <span className="block text-slate-600">{c.comment}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Bacheca */}
        <section>
          <h3 className="mb-3 font-display text-lg font-semibold uppercase tracking-wide text-slate-700">
            Bacheca dei presidenti
          </h3>
          {comments.length === 0 ? (
            <p className="text-sm text-slate-400">
              Ancora nessun commento. Simula una giornata o vota qui accanto.
            </p>
          ) : (
            <ul className="space-y-2">
              {comments.slice(0, 30).map((v) => (
                <li
                  key={v.id}
                  className="group flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
                >
                  <div className="flex-1 text-sm">
                    <div className="text-xs text-slate-400">
                      <span className="font-semibold text-slate-600">{v.fromLabel}</span> →{" "}
                      <span className="font-semibold text-slate-600">
                        {labelByTeam.get(v.toTeam) ?? v.toTeam}
                      </span>{" "}
                      · {timeAgo(v.createdAt)}
                    </div>
                    <div className="text-slate-700">
                      «{v.comment}»{" "}
                      <span className="font-bold text-emerald-700">{v.score}/10</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeComment(v.id)}
                    disabled={busy === v.id}
                    title="Rimuovi commento (admin)"
                    className="mt-0.5 rounded-md px-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-[11px] italic text-slate-400">
            Bacheca senza filtri (goliardica): come admin di lega puoi rimuovere un commento con ✕.
          </p>
        </section>
      </div>
    </div>
  );
}
