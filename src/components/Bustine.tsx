"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CardItem, ChallengeItem, LeaguePlayer, LeagueTeam } from "@/lib/league/types";
import {
  PACK_TYPES,
  RARITY_META,
  RARITY_ORDER,
  COIN_PACKS,
  type CardRarity,
} from "@/lib/league/cards";
import { SectionTitle } from "./ui";
import Figurina from "./figurine/Figurina";

// Esito dell'apertura di una bustina (rispecchia PackResult del repository).
interface RevealResult {
  rarity: string;
  playerId: string;
  playerName: string;
  duplicate: boolean;
  refund: number;
  coins: number;
}

function CoinAmount({ n, className = "" }: { n: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span aria-hidden>🪙</span>
      <span className="tabular-nums">{n}</span>
    </span>
  );
}

// Figurina di anteprima per mostrare l'artwork di una rarità con un nome giocatore.
function cardPreviewPlayer(name: string, rarity: string): LeaguePlayer {
  return {
    id: `card-preview-${rarity}-${name}`,
    name,
    role: "A",
    club: "—",
    quota: 0,
    fm: 6,
    imageUrl: null,
    number: 10,
    owner: {
      name: "",
      crestUrl: null,
      jerseyFrontUrl: null,
      jerseyBackUrl: null,
      color1: "#123D28",
      color2: "#D4AF37",
    },
    isIdol: false,
    idolProgress: null,
    skinKey: rarity,
  };
}

// Overlay di apertura bustina: suspense (bustina che vibra) → reveal della carta.
function PackOpenModal({ result, onClose }: { result: RevealResult; onClose: () => void }) {
  const [phase, setPhase] = useState<"suspense" | "reveal">("suspense");
  useEffect(() => {
    const t = setTimeout(() => setPhase("reveal"), 1500);
    return () => clearTimeout(t);
  }, []);

  const rarity = (RARITY_ORDER as string[]).includes(result.rarity)
    ? (result.rarity as CardRarity)
    : "classica";
  const meta = RARITY_META[rarity];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={phase === "reveal" ? onClose : undefined}
    >
      <div
        className={`relative w-full max-w-xs overflow-hidden rounded-3xl bg-verde-900 p-7 text-center text-white shadow-2xl ring-1 ring-white/10 ${
          phase === "reveal" ? "pack-reveal" : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bagliore in base alla rarità */}
        <div
          className="ceremony-glow pointer-events-none absolute left-1/2 top-[42%] h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: `radial-gradient(circle, ${meta.glow}88, transparent 68%)` }}
          aria-hidden
        />

        {phase === "suspense" ? (
          <div className="relative py-10">
            <div className="pack-shake mx-auto flex h-40 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-oro to-oro-700 text-5xl shadow-xl ring-2 ring-white/20">
              🎴
            </div>
            <div className="mt-6 text-sm font-bold uppercase tracking-[0.25em] text-white/70">
              Apertura in corso…
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/70">
              Bustina aperta!
            </div>
            <div className="mx-auto mt-4 flex w-fit justify-center">
              <Figurina player={cardPreviewPlayer(result.playerName, rarity)} size="md" />
            </div>
            <span
              className={`mt-4 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${meta.chip}`}
            >
              {meta.label}
            </span>
            <h2 className="mt-1 font-display text-2xl font-bold text-oro">{result.playerName}</h2>
            {result.duplicate ? (
              <p className="mt-1 text-sm text-white/70">
                Doppione! Convertito in{" "}
                <CoinAmount n={result.refund} className="font-semibold text-oro" />
              </p>
            ) : (
              <p className="mt-1 text-sm text-white/60">Nuova carta aggiunta alla collezione.</p>
            )}
            <button
              onClick={onClose}
              className="mt-5 w-full rounded-xl bg-oro px-5 py-3 text-sm font-bold uppercase tracking-wide text-verde-900 transition hover:brightness-105"
            >
              Fantastico!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Percentuali di rarità di un tipo di bustina (i pesi sommano a 100).
function weightsLabel(weights: Record<CardRarity, number>): string {
  const total = RARITY_ORDER.reduce((s, r) => s + weights[r], 0);
  return RARITY_ORDER.map(
    (r) => `${RARITY_META[r].label} ${Math.round((weights[r] / total) * 100)}%`,
  ).join(" · ");
}

export default function Bustine({
  userTeam,
  coins,
  challenges,
  collection,
  freePackAvailable,
  acquistoAbilitato,
}: {
  userTeam: LeagueTeam;
  coins: number;
  challenges: ChallengeItem[];
  collection: CardItem[];
  freePackAvailable: boolean;
  acquistoAbilitato: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [opening, setOpening] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<RevealResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyPlayer, setBusyPlayer] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | CardRarity>("all");

  // Conteggi per rarità (per i filtri).
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: collection.length, classica: 0, speciale: 0, iconica: 0 };
    for (const card of collection) if (card.rarity in c) c[card.rarity]++;
    return c;
  }, [collection]);

  const visibleCards = useMemo(
    () => (filter === "all" ? collection : collection.filter((c) => c.rarity === filter)),
    [collection, filter],
  );

  // Carte dei giocatori ATTUALMENTE in rosa, raggruppate per giocatore (per l'applicazione).
  const rosterCards = useMemo(() => {
    const map = new Map<string, { name: string; rarities: CardRarity[] }>();
    for (const card of collection) {
      if (!card.inRoster) continue;
      if (!(RARITY_ORDER as string[]).includes(card.rarity)) continue;
      const entry = map.get(card.playerId) ?? { name: card.playerName, rarities: [] };
      const r = card.rarity as CardRarity;
      if (!entry.rarities.includes(r)) entry.rarities.push(r);
      map.set(card.playerId, entry);
    }
    // ordina le rarità di ogni giocatore per pregio crescente
    for (const e of map.values()) e.rarities.sort((a, b) => RARITY_ORDER.indexOf(a) - RARITY_ORDER.indexOf(b));
    return map;
  }, [collection]);

  const playerById = useMemo(() => {
    const m = new Map<string, LeaguePlayer>();
    for (const p of userTeam.players) m.set(p.id, p);
    return m;
  }, [userTeam.players]);

  async function openPack(type: string, free: boolean) {
    const key = free ? "free" : type;
    setOpening(key);
    setError(null);
    try {
      const res = await fetch("/api/pack/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, free }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Impossibile aprire la bustina.");
      setRevealed(data as RevealResult);
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore.");
    } finally {
      setOpening(null);
    }
  }

  async function applyCard(playerId: string, rarity: string) {
    setBusyPlayer(playerId);
    setError(null);
    try {
      const res = await fetch("/api/skin/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, rarity: rarity || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Impossibile applicare la carta.");
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore.");
    } finally {
      setBusyPlayer(null);
    }
  }

  return (
    <div>
      <SectionTitle
        overline="Fanta Coins & Bustine"
        title="Le mie bustine"
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-verde-900 px-4 py-2 font-display text-lg font-bold text-oro">
            <CoinAmount n={coins} />
          </span>
        }
      />

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Sfide del giorno */}
      <section className="mb-8">
        <h3 className="mb-3 font-display text-lg font-semibold uppercase tracking-wide text-slate-700">
          Sfide del giorno
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {challenges.map((c) => (
            <div
              key={c.id}
              className={`rounded-2xl border p-4 shadow-sm ${
                c.completed ? "border-verde-200 bg-verde-50" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold text-slate-800">{c.description}</span>
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    c.completed ? "bg-verde text-white" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {c.completed ? "✓" : "•"}
                </span>
              </div>
              <div className="mt-2 text-xs font-bold uppercase tracking-wide text-oro-700">
                <CoinAmount n={c.reward} /> {c.completed ? "· ottenuti" : "in premio"}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-400">Le sfide si rinnovano a ogni giornata simulata.</p>
      </section>

      {/* Apri una bustina */}
      <section className="mb-8">
        <h3 className="mb-3 font-display text-lg font-semibold uppercase tracking-wide text-slate-700">
          Apri una bustina
        </h3>

        {/* Bustina del giorno gratuita */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-verde-200 bg-verde-50 p-4 shadow-sm">
          <div>
            <div className="font-display text-base font-bold text-verde-900">🎁 Bustina del giorno</div>
            <p className="text-sm text-slate-600">
              {freePackAvailable
                ? "Una bustina Economica gratuita, offerta ogni giornata."
                : "Già ritirata: torna dopo la prossima giornata simulata."}
            </p>
          </div>
          <button
            onClick={() => openPack("economica", true)}
            disabled={!freePackAvailable || opening !== null}
            className="inline-flex items-center gap-2 rounded-xl bg-verde px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow transition hover:bg-verde-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {opening === "free" ? "Apro..." : freePackAvailable ? "Ritira gratis" : "Ritirata"}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {PACK_TYPES.map((pack) => {
            const affordable = coins >= pack.cost;
            const premium = pack.key === "premium";
            return (
              <div
                key={pack.key}
                className={`flex flex-col justify-between rounded-2xl border p-5 shadow-sm ${
                  premium
                    ? "border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 to-white"
                    : "border-sky-200 bg-gradient-to-br from-sky-50 to-white"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-display text-xl font-bold text-slate-900">{pack.label}</h4>
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-bold ${
                        premium ? "bg-fuchsia-600 text-white" : "bg-sky-600 text-white"
                      }`}
                    >
                      <CoinAmount n={pack.cost} />
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-medium text-slate-500">{weightsLabel(pack.weights)}</p>
                </div>
                <button
                  onClick={() => openPack(pack.key, false)}
                  disabled={!affordable || opening !== null}
                  className={`mt-4 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    premium ? "bg-fuchsia-600 hover:bg-fuchsia-700" : "bg-sky-600 hover:bg-sky-700"
                  }`}
                >
                  {opening === pack.key ? "Apro..." : "Apri bustina"}
                </button>
                {!affordable && (
                  <p className="mt-2 text-xs font-medium text-amber-700">
                    Fanta Coins insufficienti: completa le sfide per guadagnarne.
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Garanzia: ogni 10 bustine aperte, la 10ª dà almeno una carta Speciale. I doppioni si convertono
          automaticamente in Fanta Coins.
        </p>
      </section>

      {/* Confronto dei 3 livelli di rarità */}
      <section className="mb-8">
        <h3 className="mb-3 font-display text-lg font-semibold uppercase tracking-wide text-slate-700">
          I 3 livelli di rarità
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {RARITY_ORDER.map((r) => (
            <div key={r} className="flex flex-col items-center gap-2">
              <Figurina player={cardPreviewPlayer("Esempio", r)} size="sm" />
              <span className="text-center text-xs font-medium text-slate-500">
                {r === "classica"
                  ? "Pulita, tinta blu."
                  : r === "speciale"
                    ? "Energia magenta animata."
                    : "Stadio serale olografico."}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Collezione (filtrabile per rarità) */}
      <section className="mb-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-lg font-semibold uppercase tracking-wide text-slate-700">
            La mia collezione{" "}
            <span className="text-sm font-normal text-slate-400">({collection.length})</span>
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {(["all", ...RARITY_ORDER] as const).map((f) => {
              const active = filter === f;
              const label = f === "all" ? "Tutte" : RARITY_META[f].label;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide transition ${
                    active
                      ? "bg-verde-900 text-oro"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {label} ({counts[f]})
                </button>
              );
            })}
          </div>
        </div>

        {collection.length === 0 ? (
          <p className="text-sm text-slate-400">
            Nessuna carta ancora. Apri una bustina per iniziare la collezione.
          </p>
        ) : visibleCards.length === 0 ? (
          <p className="text-sm text-slate-400">Nessuna carta di questa rarità.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {visibleCards.map((card) => (
              <div key={card.id} className="relative flex flex-col items-center gap-1.5">
                <Figurina player={cardPreviewPlayer(card.playerName, card.rarity)} size="sm" />
                {card.inRoster && (
                  <span className="rounded-full bg-verde px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    In rosa
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Applica le carte alle figurine (solo giocatori in rosa, non idolo) */}
      {rosterCards.size > 0 && (
        <section className="mb-8">
          <h3 className="mb-3 font-display text-lg font-semibold uppercase tracking-wide text-slate-700">
            Applica le carte alle tue figurine
          </h3>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <ul className="divide-y divide-slate-100">
              {[...rosterCards.entries()].map(([playerId, info]) => {
                const player = playerById.get(playerId);
                if (!player || player.isIdol) return null;
                return (
                  <li key={playerId} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="flex-1 text-sm">
                      <span className="font-semibold text-slate-900">{info.name}</span>
                      <span className="text-slate-400"> · {player.club}</span>
                    </span>
                    <select
                      value={player.skinKey ?? ""}
                      disabled={busyPlayer === playerId}
                      onChange={(e) => applyCard(playerId, e.target.value)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-verde-500 focus:outline-none disabled:opacity-60"
                    >
                      <option value="">Nessuna carta</option>
                      {info.rarities.map((r) => (
                        <option key={r} value={r}>
                          {RARITY_META[r].label}
                        </option>
                      ))}
                    </select>
                  </li>
                );
              })}
            </ul>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Puoi applicare lo stile di una carta solo se il giocatore è nella tua rosa. L&apos;idolo usa la
            carta a scudo e non è personalizzabile.
          </p>
        </section>
      )}

      {/* Acquisto Fanta Coins (dietro feature flag) */}
      <section>
        <h3 className="mb-3 font-display text-lg font-semibold uppercase tracking-wide text-slate-700">
          Acquista Fanta Coins
        </h3>
        {!acquistoAbilitato && (
          <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">
            Funzionalità non ancora attiva.
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          {COIN_PACKS.map((p) => (
            <div key={p.key} className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{p.label}</div>
              <div className="mt-1 font-display text-3xl font-bold text-slate-900">
                <CoinAmount n={p.coins} />
              </div>
              <div className="mt-1 text-sm text-slate-500">{p.price}</div>
              <button
                disabled={!acquistoAbilitato}
                title={acquistoAbilitato ? "Acquista" : "Funzionalità non ancora attiva"}
                className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {acquistoAbilitato ? "Acquista" : "Non attiva"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {revealed && <PackOpenModal result={revealed} onClose={() => setRevealed(null)} />}
    </div>
  );
}
