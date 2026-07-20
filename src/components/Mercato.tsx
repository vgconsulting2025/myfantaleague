"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { EnrichedProposal, TradeRecord } from "@/lib/league/types";
import { ErrorBox, SectionTitle, Spinner } from "./ui";
import { timeAgo } from "./format";
import Figurina from "./figurine/Figurina";

export default function Mercato({
  trades,
  proposals,
  setProposals,
}: {
  trades: TradeRecord[];
  proposals: EnrichedProposal[];
  setProposals: React.Dispatch<React.SetStateAction<EnrichedProposal[]>>;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function chiamaAgente() {
    setLoading(true);
    setError(null);
    setProposals([]);
    try {
      const res = await fetch("/api/trades", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Errore di generazione.");
      setProposals(data.proposals as EnrichedProposal[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore di generazione.");
    } finally {
      setLoading(false);
    }
  }

  async function decidi(p: EnrichedProposal, accepted: boolean) {
    setBusyId(p.id);
    setError(null);
    try {
      const res = await fetch("/api/trades/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otherTeam: p.otherTeam,
          give: p.give,
          receive: p.receive,
          rationale: p.rationale,
          agentComment: p.agentComment,
          accepted,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Impossibile registrare la decisione.");
      setProposals((prev) =>
        prev.map((x) =>
          x.id === p.id ? { ...x, status: accepted ? "accepted" : "rejected" } : x,
        ),
      );
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <SectionTitle
        overline="L'Agente · Mercato settimanale"
        title="Mercato"
        action={
          <button
            onClick={chiamaAgente}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Chiama l&apos;Agente
          </button>
        }
      />

      {loading && <Spinner label="L'Agente sta studiando le rose..." />}
      {error && <ErrorBox message={error} onRetry={undefined} />}

      {!loading && proposals.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-14 text-center">
          <div className="font-display text-2xl font-bold text-slate-800">Il mercato è fermo</div>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Chiama l&apos;Agente: analizzerà la tua rosa e quelle degli avversari per proporti gli
            scambi della settimana.
          </p>
        </div>
      )}

      {proposals.length > 0 && (
        <div className="grid gap-4">
          {proposals.map((p) => {
            const decided = p.status !== "pending";
            return (
              <div
                key={p.id}
                className={`rounded-2xl border p-5 shadow-sm transition ${
                  p.status === "accepted"
                    ? "border-emerald-200 bg-emerald-50"
                    : p.status === "rejected"
                      ? "border-slate-200 bg-slate-50 opacity-70"
                      : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <div className="text-center">
                    <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-rose-500">
                      Cedi
                    </div>
                    {p.givePlayer ? (
                      <Figurina
                        player={p.givePlayer}
                        size="sm"
                        href={`/figurina/${p.givePlayer.id}`}
                      />
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </div>
                  <div className="font-display text-3xl text-emerald-600">⇄</div>
                  <div className="text-center">
                    <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                      Ricevi
                    </div>
                    {p.receivePlayer ? (
                      <Figurina
                        player={p.receivePlayer}
                        size="sm"
                        href={`/figurina/${p.receivePlayer.id}`}
                      />
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </div>
                </div>

                <div className="mt-3 text-xs uppercase tracking-wide text-slate-400">
                  Scambio con <span className="font-semibold text-slate-600">{p.otherTeam}</span>
                </div>
                {p.rationale && (
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{p.rationale}</p>
                )}
                {p.agentComment && (
                  <p className="mt-2 text-sm italic text-slate-500">L&apos;Agente: «{p.agentComment}»</p>
                )}

                <div className="mt-4">
                  {decided ? (
                    <span
                      className={`text-sm font-semibold uppercase tracking-wide ${
                        p.status === "accepted" ? "text-emerald-700" : "text-rose-600"
                      }`}
                    >
                      {p.status === "accepted" ? "✓ Scambio ufficializzato" : "✕ Proposta rifiutata"}
                    </span>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={() => decidi(p, true)}
                        disabled={busyId === p.id}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                      >
                        Accetta
                      </button>
                      <button
                        onClick={() => decidi(p, false)}
                        disabled={busyId === p.id}
                        className="rounded-lg border-2 border-rose-500 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                      >
                        Rifiuta
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Storico scambi della lega */}
      <section className="mt-10">
        <h3 className="mb-3 font-display text-lg font-semibold uppercase tracking-wide text-slate-700">
          Storico scambi
        </h3>
        {trades.length === 0 ? (
          <p className="text-sm text-slate-400">
            Ancora nessuno scambio registrato. Le trattative concluse compariranno qui.
          </p>
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {trades.map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-3 last:border-b-0"
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
                    t.status === "accepted" ? "bg-emerald-600" : "bg-rose-500"
                  }`}
                >
                  {t.status === "accepted" ? "✓" : "✕"}
                </span>
                <span className="flex-1 text-sm text-slate-700">
                  <span className="font-semibold">{t.fromTeam}</span> cede{" "}
                  <span className="font-semibold">{t.giveName}</span> · riceve{" "}
                  <span className="font-semibold">{t.receiveName}</span> da{" "}
                  <span className="font-semibold">{t.toTeam}</span>
                </span>
                <span className="text-xs text-slate-400">{timeAgo(t.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
