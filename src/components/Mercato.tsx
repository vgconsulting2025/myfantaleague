"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  EnrichedProposal,
  FreeAgentProposalItem,
  Role,
  TradeRecord,
} from "@/lib/league/types";
import { ErrorBox, SectionTitle, Spinner } from "./ui";
import { timeAgo } from "./format";
import Figurina from "./figurine/Figurina";
import TeamCrest from "./brand/TeamCrest";

const ROLE_LABEL: Record<Role, string> = { P: "P", D: "D", C: "C", A: "A" };

export default function Mercato({
  trades,
  proposals,
  setProposals,
  freeAgentProposals,
}: {
  trades: TradeRecord[];
  proposals: EnrichedProposal[];
  setProposals: React.Dispatch<React.SetStateAction<EnrichedProposal[]>>;
  freeAgentProposals: FreeAgentProposalItem[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [faBusyId, setFaBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const faPending = freeAgentProposals.filter((p) => p.forUser && p.status === "pending");
  const faHistory = freeAgentProposals.filter((p) => !(p.forUser && p.status === "pending"));

  async function decidiSvincolato(id: string, accepted: boolean) {
    setFaBusyId(id);
    setError(null);
    try {
      const res = await fetch("/api/free-agents/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, accepted }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Impossibile registrare la decisione.");
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore.");
    } finally {
      setFaBusyId(null);
    }
  }

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
            className="inline-flex items-center gap-2 rounded-xl bg-verde px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-verde-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Chiama l&apos;Agente
          </button>
        }
      />

      {error && <ErrorBox message={error} onRetry={undefined} />}

      <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold uppercase tracking-wide text-slate-700">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-verde text-xs text-white">
          ⇄
        </span>
        Scambi tra squadre
      </h3>

      {loading && <Spinner label="L'Agente sta studiando le rose..." />}

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
                    ? "border-verde-200 bg-verde-50"
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
                  <div className="font-display text-3xl text-verde">⇄</div>
                  <div className="text-center">
                    <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-verde">
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

                <div className="mt-3 flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-400">
                  <span>Scambio con</span>
                  <span className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-slate-50 ring-1 ring-slate-200">
                    <TeamCrest crestUrl={p.receivePlayer?.owner?.crestUrl} className="h-full w-full" />
                  </span>
                  <span className="font-semibold text-slate-600">{p.otherTeam}</span>
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
                        p.status === "accepted" ? "text-verde-700" : "text-rose-600"
                      }`}
                    >
                      {p.status === "accepted" ? "✓ Scambio ufficializzato" : "✕ Proposta rifiutata"}
                    </span>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={() => decidi(p, true)}
                        disabled={busyId === p.id}
                        className="rounded-lg bg-verde px-4 py-2 text-sm font-semibold text-white transition hover:bg-verde-700 disabled:opacity-60"
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

      {/* Storico scambi tra squadre */}
      <section className="mt-8">
        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Storico scambi tra squadre
        </h4>
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
                    t.status === "accepted" ? "bg-verde" : "bg-rose-500"
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

      {/* ============ Offerte dagli svincolati ============ */}
      <div className="mt-12 border-t border-slate-200 pt-8">
        <h3 className="mb-1 flex items-center gap-2 font-display text-lg font-semibold uppercase tracking-wide text-slate-700">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-oro text-xs text-verde-900">
            ★
          </span>
          Offerte dagli svincolati
        </h3>
        <p className="mb-4 text-sm text-slate-500">
          L&apos;Agente pesca dal mercato degli svincolati e propone scambi 1-per-1. Le offerte per la
          tua squadra le decidi tu; le altre le gestisce in autonomia.
        </p>

        {faPending.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Nessuna offerta dagli svincolati in attesa. L&apos;Agente si muove quando simuli una
            giornata.
          </div>
        ) : (
          <div className="grid gap-4">
            {faPending.map((p) => (
              <div key={p.id} className="rounded-2xl border border-oro-200 bg-oro-50/40 p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-center gap-4 text-center">
                  <div>
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-rose-500">
                      Liberi
                    </div>
                    <div className="font-display text-lg font-semibold text-slate-900">
                      {p.giveName}
                    </div>
                    <div className="text-xs text-slate-500">
                      {ROLE_LABEL[p.giveRole]} · fm {p.giveFm.toFixed(1)} · q {p.giveQuota}
                    </div>
                  </div>
                  <div className="font-display text-3xl text-oro">⇄</div>
                  <div>
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-verde">
                      Tesseri (svincolato)
                    </div>
                    <div className="font-display text-lg font-semibold text-slate-900">
                      {p.faName}
                    </div>
                    <div className="text-xs text-slate-500">
                      {ROLE_LABEL[p.faRole]} · fm {p.faFm.toFixed(1)} · q {p.faQuota} · ex {p.faClub}
                    </div>
                  </div>
                </div>
                {p.rationale && (
                  <p className="mt-3 text-sm leading-relaxed text-slate-700">{p.rationale}</p>
                )}
                {p.agentComment && (
                  <p className="mt-2 text-sm italic text-slate-500">L&apos;Agente: «{p.agentComment}»</p>
                )}
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => decidiSvincolato(p.id, true)}
                    disabled={faBusyId === p.id}
                    className="rounded-lg bg-verde px-4 py-2 text-sm font-semibold text-white transition hover:bg-verde-700 disabled:opacity-60"
                  >
                    Tessera lo svincolato
                  </button>
                  <button
                    onClick={() => decidiSvincolato(p.id, false)}
                    disabled={faBusyId === p.id}
                    className="rounded-lg border-2 border-rose-500 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                  >
                    Rifiuta
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Storico offerte svincolati */}
        <div className="mt-8">
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Storico offerte svincolati
          </h4>
          {faHistory.length === 0 ? (
            <p className="text-sm text-slate-400">
              Ancora nessuna offerta conclusa. Gli affari con gli svincolati compariranno qui.
            </p>
          ) : (
            <ul className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {faHistory.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-3 last:border-b-0"
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
                      p.status === "accepted"
                        ? "bg-verde"
                        : p.status === "rejected"
                          ? "bg-rose-500"
                          : "bg-slate-400"
                    }`}
                  >
                    {p.status === "accepted" ? "✓" : p.status === "rejected" ? "✕" : "…"}
                  </span>
                  <span className="flex-1 text-sm text-slate-700">
                    <span className="font-semibold">{p.teamName}</span>{" "}
                    {p.status === "accepted"
                      ? "tessera"
                      : p.status === "rejected"
                        ? "rinuncia a"
                        : "valuta"}{" "}
                    <span className="font-semibold">{p.faName}</span>
                    {p.status === "accepted" && (
                      <>
                        {" "}
                        e libera <span className="font-semibold">{p.giveName}</span>
                      </>
                    )}
                  </span>
                  <span className="text-xs text-slate-400">{timeAgo(p.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
