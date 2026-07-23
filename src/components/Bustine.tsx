"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ChallengeItem, LeagueTeam, LeaguePlayer, OwnedSkinItem } from "@/lib/league/types";
import { SKINS, RARITY_META, PACK_COST, COIN_PACKS, skinByKey } from "@/lib/league/skins";
import { SectionTitle } from "./ui";
import Figurina from "./figurine/Figurina";

function CoinAmount({ n, className = "" }: { n: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span aria-hidden>🪙</span>
      <span className="tabular-nums">{n}</span>
    </span>
  );
}

// Mostra la skin su una figurina di esempio (per reveal e inventario).
function skinPreviewPlayer(skinKey: string): LeaguePlayer {
  return {
    id: `skin-preview-${skinKey}`,
    name: "Anteprima",
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
    skinKey,
  };
}

// Overlay di apertura bustina con reveal drammatico.
function PackOpenModal({ skinKey, onClose }: { skinKey: string; onClose: () => void }) {
  const skin = skinByKey(skinKey);
  if (!skin) return null;
  const rarity = RARITY_META[skin.rarity];
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="pack-reveal relative w-full max-w-xs overflow-hidden rounded-3xl bg-verde-900 p-7 text-center text-white shadow-2xl ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bagliore in base alla rarità */}
        <div
          className="ceremony-glow pointer-events-none absolute left-1/2 top-[40%] h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: `radial-gradient(circle, ${rarity.glow}88, transparent 68%)` }}
          aria-hidden
        />
        <div className="relative">
          <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/70">Bustina aperta!</div>
          <div className="mx-auto mt-4 flex w-fit justify-center">
            <Figurina player={skinPreviewPlayer(skinKey)} size="md" />
          </div>
          <span
            className={`mt-4 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${rarity.chip}`}
          >
            {rarity.label}
          </span>
          <h2 className="mt-1 font-display text-2xl font-bold text-oro">{skin.name}</h2>
          <p className="mt-1 text-sm text-white/60">Skin cosmetica aggiunta all&apos;inventario.</p>
          <button
            onClick={onClose}
            className="mt-5 w-full rounded-xl bg-oro px-5 py-3 text-sm font-bold uppercase tracking-wide text-verde-900 transition hover:brightness-105"
          >
            Fantastico!
          </button>
        </div>
      </div>
    </div>
  );
}

function SkinSwatch({ skinKey, count }: { skinKey: string; count?: number }) {
  const skin = skinByKey(skinKey);
  if (!skin) return null;
  const rarity = RARITY_META[skin.rarity];
  return (
    <div className={`rounded-2xl p-[3px] shadow-sm ring-1 ${rarity.ring}`} style={{ background: skin.frame }}>
      <div className="rounded-[13px] bg-white p-3">
        <div className="relative h-16 overflow-hidden rounded-lg" style={{ background: skin.frame }} aria-hidden>
          {skin.overlay && <span className="absolute inset-0" style={{ background: skin.overlay }} />}
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="truncate font-display text-sm font-bold text-slate-900">
            {skin.name}
            {count && count > 1 ? ` ×${count}` : ""}
          </span>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${rarity.chip}`}>
            {rarity.label}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Bustine({
  userTeam,
  coins,
  challenges,
  ownedSkins,
  acquistoAbilitato,
}: {
  userTeam: LeagueTeam;
  coins: number;
  challenges: ChallengeItem[];
  ownedSkins: OwnedSkinItem[];
  acquistoAbilitato: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [opening, setOpening] = useState(false);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyPlayer, setBusyPlayer] = useState<string | null>(null);

  const applicablePlayers = userTeam.players.filter((p) => !p.isIdol);

  async function openPack() {
    setOpening(true);
    setError(null);
    try {
      const res = await fetch("/api/pack/open", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Impossibile aprire la bustina.");
      setRevealed(data.skinKey);
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore.");
    } finally {
      setOpening(false);
    }
  }

  async function applySkin(playerId: string, skinKey: string) {
    setBusyPlayer(playerId);
    setError(null);
    try {
      const res = await fetch("/api/skin/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, skinKey: skinKey || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Impossibile applicare la skin.");
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
      <section className="mb-8 overflow-hidden rounded-2xl border border-oro-200 bg-gradient-to-br from-oro-50 to-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-xl font-bold text-slate-900">Apri una bustina</h3>
            <p className="mt-1 text-sm text-slate-600">
              Costa <CoinAmount n={PACK_COST} className="font-semibold text-oro-700" /> · assegna una skin cosmetica
              casuale (comune / rara / leggendaria).
            </p>
          </div>
          <button
            onClick={openPack}
            disabled={opening || coins < PACK_COST}
            className="inline-flex items-center gap-2 rounded-xl bg-verde px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow transition hover:bg-verde-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {opening ? "Apro..." : `Apri bustina`}
          </button>
        </div>
        {coins < PACK_COST && (
          <p className="mt-2 text-xs font-medium text-amber-700">
            Fanta Coins insufficienti: completa le sfide per guadagnarne.
          </p>
        )}
      </section>

      {/* Acquisto Fanta Coins (dietro feature flag) */}
      <section className="mb-8">
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

      {/* Inventario skin */}
      <section className="mb-8">
        <h3 className="mb-3 font-display text-lg font-semibold uppercase tracking-wide text-slate-700">
          Inventario skin{" "}
          <span className="text-sm font-normal text-slate-400">
            ({ownedSkins.length}/{SKINS.length})
          </span>
        </h3>
        {ownedSkins.length === 0 ? (
          <p className="text-sm text-slate-400">Nessuna skin ancora. Apri una bustina per iniziare la collezione.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {ownedSkins.map((s) => (
              <SkinSwatch key={s.skinKey} skinKey={s.skinKey} count={s.count} />
            ))}
          </div>
        )}
      </section>

      {/* Applica skin alle figurine (non idolo) */}
      {ownedSkins.length > 0 && (
        <section>
          <h3 className="mb-3 font-display text-lg font-semibold uppercase tracking-wide text-slate-700">
            Applica le skin alle tue figurine
          </h3>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <ul className="divide-y divide-slate-100">
              {applicablePlayers.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="flex-1 text-sm">
                    <span className="font-semibold text-slate-900">{p.name}</span>
                    <span className="text-slate-400"> · {p.club}</span>
                  </span>
                  <select
                    value={p.skinKey ?? ""}
                    disabled={busyPlayer === p.id}
                    onChange={(e) => applySkin(p.id, e.target.value)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-verde-500 focus:outline-none disabled:opacity-60"
                  >
                    <option value="">Nessuna skin</option>
                    {ownedSkins.map((s) => {
                      const skin = skinByKey(s.skinKey);
                      return (
                        <option key={s.skinKey} value={s.skinKey}>
                          {skin ? `${skin.name} (${RARITY_META[skin.rarity].label})` : s.skinKey}
                        </option>
                      );
                    })}
                  </select>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Le skin sono solo estetiche e non si applicano all&apos;idolo (che usa la carta a scudo).
          </p>
        </section>
      )}

      {revealed && <PackOpenModal skinKey={revealed} onClose={() => setRevealed(null)} />}
    </div>
  );
}
