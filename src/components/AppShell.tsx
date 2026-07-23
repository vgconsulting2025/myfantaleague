"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  Article,
  CoachRatingItem,
  Edition,
  EnrichedProposal,
  FlashItem,
  FreeAgentProposalItem,
  Giornata,
  LeagueConfig,
  LeaguePlayer,
  LeagueTeam,
  PeerVoteItem,
  PresidentStanding,
  TradeRecord,
} from "@/lib/league/types";
import Gazzetta from "./Gazzetta";
import Mercato from "./Mercato";
import Squadra from "./Squadra";
import Classifica from "./Classifica";
import Voti from "./Voti";
import Configura from "./Configura";
import BrandMark from "./brand/BrandMark";

type TabId = "gazzetta" | "mercato" | "squadra" | "classifica" | "voti" | "configura";

const TABS: { id: TabId; label: string }[] = [
  { id: "gazzetta", label: "La Gazzetta" },
  { id: "mercato", label: "Mercato" },
  { id: "squadra", label: "La Mia Squadra" },
  { id: "classifica", label: "Classifica" },
  { id: "voti", label: "Voti" },
  { id: "configura", label: "Configura" },
];

interface AppShellProps {
  userTeam: LeagueTeam;
  standings: LeagueTeam[];
  editions: Edition[];
  trades: TradeRecord[];
  flash: FlashItem[];
  latestGiornata: Giornata | null;
  presidentStandings: PresidentStanding[];
  peerVotes: PeerVoteItem[];
  coachRatings: CoachRatingItem[];
  config: LeagueConfig;
  recentNews: Article[];
  freeAgents: LeaguePlayer[];
  freeAgentProposals: FreeAgentProposalItem[];
  demoMode: boolean;
  initialTab?: string;
}

export default function AppShell({
  userTeam,
  standings,
  editions,
  trades,
  flash,
  latestGiornata,
  presidentStandings,
  peerVotes,
  coachRatings,
  config,
  recentNews,
  freeAgents,
  freeAgentProposals,
  demoMode,
  initialTab,
}: AppShellProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [tab, setTab] = useState<TabId>(
    TABS.some((t) => t.id === initialTab) ? (initialTab as TabId) : "gazzetta",
  );
  const [proposals, setProposals] = useState<EnrichedProposal[]>([]);
  const [simulating, setSimulating] = useState(false);

  // Badge sul Mercato: proposte squadra-squadra in sospeso (stato locale) +
  // proposte dagli svincolati rivolte all'utente e ancora da decidere.
  const faPendingCount = freeAgentProposals.filter(
    (p) => p.forUser && p.status === "pending",
  ).length;
  const pendingCount =
    proposals.filter((p) => p.status === "pending").length + faPendingCount;

  async function simula() {
    setSimulating(true);
    try {
      const res = await fetch("/api/simulate", { method: "POST" });
      if (res.ok) startTransition(() => router.refresh());
    } finally {
      setSimulating(false);
    }
  }

  return (
    <>
      {/* Header verde scuro fisso */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-oro/30 bg-verde-900 text-white shadow-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <button
            onClick={() => setTab("gazzetta")}
            className="flex shrink-0 items-center gap-2 font-display text-lg font-bold tracking-tight"
          >
            <BrandMark className="h-8 w-8" />
            <span className="text-oro">
              MyFanta<span className="text-oro-200">League</span>
            </span>
          </button>

          <nav className="no-scrollbar flex flex-1 items-center gap-1 overflow-x-auto">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold uppercase tracking-wide transition ${
                    active
                      ? "bg-oro text-verde-900 shadow-sm"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {t.label}
                  {t.id === "mercato" && pendingCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-oro px-1 text-[10px] font-bold text-verde-900 ring-2 ring-verde-900">
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <button
            onClick={simula}
            disabled={simulating}
            title="Simula una giornata di campionato"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-oro/40 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-oro transition hover:bg-oro/10 disabled:opacity-60"
          >
            <span className={simulating ? "inline-block animate-spin" : "inline-block"}>⟳</span>
            <span className="hidden sm:inline">
              {simulating ? "Simulo..." : "Simula giornata"}
            </span>
          </button>
        </div>
      </header>

      <main className="pt-16">
        {/* Sotto-header con info lega */}
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-verde">
                Lega Bar Centrale · Stagione 2025/26
              </div>
              <div className="text-sm text-slate-500">
                {latestGiornata
                  ? `Giornata ${latestGiornata.number} · ${latestGiornata.results.length} partite`
                  : "Nessuna giornata giocata"}
              </div>
            </div>
            <div className="flex flex-col items-start gap-1 sm:items-end">
              {demoMode && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Modalità demo — contenuti non generati da AI
                </span>
              )}
              <span className="text-sm italic text-slate-400">
                La tua lega, viva tutti i giorni.
              </span>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-6">
          {tab === "gazzetta" && (
            <Gazzetta
              editions={editions}
              flash={flash}
              gazzettaName={config.gazzettaName}
              recentNews={recentNews}
            />
          )}
          {tab === "mercato" && (
            <Mercato
              trades={trades}
              proposals={proposals}
              setProposals={setProposals}
              freeAgentProposals={freeAgentProposals}
            />
          )}
          {tab === "squadra" && (
            <Squadra userTeam={userTeam} latestGiornataNumber={latestGiornata?.number ?? 0} />
          )}
          {tab === "classifica" && <Classifica standings={standings} />}
          {tab === "voti" && (
            <Voti
              standings={presidentStandings}
              peerVotes={peerVotes}
              coachRatings={coachRatings}
              userTeam={userTeam}
            />
          )}
          {tab === "configura" && (
            <Configura userTeam={userTeam} config={config} freeAgents={freeAgents} />
          )}
        </div>
      </main>
    </>
  );
}
