// Cerimonia di incoronazione: overlay teatrale mostrato quando il presidente
// designa (o cambia) l'idolo. Anteprima della figurina trasformata in idolo
// (Bronzo, il livello di partenza), titolo a effetto, confetti + glow leggeri e
// pulsante per confermare (chiama /api/idol tramite onConfirm) o annullare.
import type { LeaguePlayer } from "@/lib/league/types";
import { ceremonyTitle } from "@/lib/league/idol";
import Figurina from "./Figurina";

const CONFETTI = Array.from({ length: 18 }).map((_, i) => ({
  left: (i * 53) % 100,
  color: ["#D4AF37", "#2f7d55", "#f4e3a0", "#7ee0a8", "#b87333", "#ffffff"][i % 6],
  delay: ((i % 6) * 0.22).toFixed(2),
  dur: (2.2 + ((i * 7) % 10) / 10).toFixed(2),
  w: 6 + (i % 3) * 2,
  h: 10 + (i % 4) * 2,
}));

const RAYS =
  "conic-gradient(from 0deg, rgba(212,175,55,0.22) 0deg, transparent 20deg, rgba(212,175,55,0.22) 40deg, transparent 60deg, rgba(212,175,55,0.22) 80deg, transparent 100deg, rgba(212,175,55,0.22) 120deg, transparent 140deg, rgba(212,175,55,0.22) 160deg, transparent 180deg, rgba(212,175,55,0.22) 200deg, transparent 220deg, rgba(212,175,55,0.22) 240deg, transparent 260deg, rgba(212,175,55,0.22) 280deg, transparent 300deg, rgba(212,175,55,0.22) 320deg, transparent 340deg)";

export default function CeremonyModal({
  player,
  isChange,
  busy,
  error,
  onConfirm,
  onClose,
}: {
  player: LeaguePlayer;
  isChange: boolean;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  // Anteprima: come apparirà da idolo (parte dal livello Bronzo).
  const preview: LeaguePlayer = {
    ...player,
    isIdol: true,
    idolProgress: { cumFm: 0, bestCount: 0, streak: 0, setGiornata: null, level: 1, quote: null },
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      {/* Confetti */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {CONFETTI.map((c, i) => (
          <span
            key={i}
            className="confetti-piece"
            style={{
              left: `${c.left}%`,
              width: c.w,
              height: c.h,
              background: c.color,
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.dur}s`,
            }}
          />
        ))}
      </div>

      <div
        className="ceremony-pop relative w-full max-w-sm overflow-hidden rounded-3xl bg-verde-900 p-7 text-center text-white shadow-2xl ring-1 ring-oro/40"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Raggi + glow dietro la figurina */}
        <div className="pointer-events-none absolute left-1/2 top-[42%] h-72 w-72 -translate-x-1/2 -translate-y-1/2" aria-hidden>
          <div className="ceremony-rays h-full w-full rounded-full" style={{ background: RAYS }} />
          <div
            className="ceremony-glow absolute inset-8 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(212,175,55,0.55), transparent 68%)" }}
          />
        </div>

        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20"
          aria-label="Chiudi"
        >
          ✕
        </button>

        <div className="relative z-[1]">
          <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-oro-200">
            Cerimonia di incoronazione
          </div>
          <h2 className="mt-1 font-display text-2xl font-bold text-oro">{ceremonyTitle(isChange)}</h2>

          <div className="mx-auto mt-4 flex w-fit justify-center">
            <Figurina player={preview} size="lg" />
          </div>

          <div className="mt-3 font-display text-3xl font-bold leading-tight">{player.name}</div>
          <div className="text-sm text-white/70">
            {player.club || "—"} · FM {player.fm.toFixed(1)}
          </div>

          {error && (
            <div className="mt-3 rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-100">{error}</div>
          )}

          <div className="mt-5 flex flex-col items-stretch gap-2">
            <button
              onClick={onConfirm}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-oro px-5 py-3 text-sm font-bold uppercase tracking-wide text-verde-900 shadow transition hover:brightness-105 disabled:opacity-60"
            >
              <span aria-hidden>♛</span> {busy ? "Incorono..." : `Incorona ${player.name}`}
            </button>
            <button
              onClick={onClose}
              className="text-sm font-semibold text-white/60 transition hover:text-white"
            >
              Annulla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
