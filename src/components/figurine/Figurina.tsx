// Figurina: card verticale stile album, cornice stondata con effetto lucido,
// fascia coi colori del club, avatar caricaturale, nome, badge ruolo, quota e
// fantamedia. Variante "rara" con cornice dorata per fantamedia alta.
import Link from "next/link";
import type { LeaguePlayer } from "@/lib/league/types";
import { getClubColors } from "@/lib/league/clubColors";
import { ROLE_BADGE } from "@/components/theme";
import PlayerAvatar from "./PlayerAvatar";

export const RARE_THRESHOLD = 7;

type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, { width: number; band: string; name: string; foot: string }> = {
  sm: { width: 118, band: "text-[9px]", name: "text-[11px]", foot: "text-[10px]" },
  md: { width: 168, band: "text-[10px]", name: "text-sm", foot: "text-xs" },
  lg: { width: 300, band: "text-sm", name: "text-lg", foot: "text-sm" },
};

// Testo leggibile (bianco o scuro) sul colore di sfondo della fascia.
function readableText(hex: string): string {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#111827" : "#FFFFFF";
}

export default function Figurina({
  player,
  size = "md",
  href,
  className = "",
}: {
  player: LeaguePlayer;
  size?: Size;
  href?: string;
  className?: string;
}) {
  const s = SIZES[size];
  const rare = player.fm >= RARE_THRESHOLD;
  const { primary } = getClubColors(player.club);
  const bandText = readableText(primary);

  const frameBg = rare
    ? "linear-gradient(145deg,#F7E7A6 0%,#D4AF37 35%,#9C7A1E 60%,#F3DE93 100%)"
    : "linear-gradient(145deg,#ffffff 0%,#dbe1e8 55%,#b9c3ce 100%)";

  const card = (
    <div
      className="relative select-none"
      style={{ width: s.width, maxWidth: "100%" }}
    >
      {/* Cornice (bordo colorato) */}
      <div
        className={`rounded-2xl p-[3px] shadow-md ${rare ? "shadow-amber-300/50" : ""}`}
        style={{ background: frameBg }}
      >
        <div className="overflow-hidden rounded-[13px] bg-white">
          {/* Fascia colori club */}
          <div
            className={`flex items-center justify-between px-2 py-1 font-semibold uppercase tracking-wide ${s.band}`}
            style={{ background: primary, color: bandText }}
          >
            <span className="truncate">{player.club || "—"}</span>
            <span
              className={`ml-1 inline-flex shrink-0 items-center justify-center rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white ${ROLE_BADGE[player.role]}`}
              style={{ height: 16 }}
            >
              {player.role}
            </span>
          </div>

          {/* Avatar */}
          <div className="relative bg-[radial-gradient(circle_at_50%_32%,#ffffff,#e9eef3)]">
            <PlayerAvatar name={player.name} club={player.club} className="block h-auto w-full" />
            {rare && (
              <span className="absolute right-1.5 top-1.5 rounded-full bg-amber-400/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-950 shadow">
                ★ Rara
              </span>
            )}
          </div>

          {/* Nome + dati */}
          <div className="border-t border-slate-100 px-2 py-1.5">
            <div className={`truncate font-display font-semibold text-slate-900 ${s.name}`}>
              {player.name}
            </div>
            <div className={`mt-0.5 flex items-center justify-between ${s.foot}`}>
              <span className="text-slate-500">Quota {player.quota}</span>
              <span
                className={`font-bold tabular-nums ${
                  player.fm >= 6.8 ? "text-emerald-600" : "text-slate-700"
                }`}
              >
                FM {player.fm.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Effetto lucido */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 22%, rgba(255,255,255,0) 42%, rgba(255,255,255,0) 100%)",
        }}
      />
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`block transition-transform duration-150 hover:-translate-y-0.5 hover:drop-shadow-lg ${className}`}
      >
        {card}
      </Link>
    );
  }
  return <div className={className}>{card}</div>;
}
