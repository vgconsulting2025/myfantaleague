// Figurina stile album. Le figurine NORMALI restano rettangolari (cornice oro
// per la variante "rara" da fantamedia, o colori sociali). Il giocatore IDOLO
// usa invece una carta premium a SCUDO con design per livello (IdolShieldCard),
// così spicca nettamente. In entrambi i casi il contenuto centrale è la foto
// caricata o la maglia di default; bordo, badge e overlay sono elementi separati.
import Link from "next/link";
import type { LeaguePlayer } from "@/lib/league/types";
import { resolvePlayerImage, resolveTeamColors, displayNumber } from "@/lib/league/identity";
import { RARITY_META, RARITY_ORDER, type CardRarity } from "@/lib/league/cards";
import { ROLE_BADGE } from "@/components/theme";
import TeamCrest from "@/components/brand/TeamCrest";
import IdolShieldCard from "./IdolShieldCard";
import { CardArtBackground, CARD_FRAMES } from "./CardArt";

type Size = "sm" | "md" | "lg";

const SIZES: Record<
  Size,
  { width: number; name: string; meta: string; num: string; crest: number; role: string }
> = {
  sm: { width: 122, name: "text-[11px]", meta: "text-[8px]", num: "h-4 w-4 text-[9px]", crest: 18, role: "text-[9px] px-1 py-0.5" },
  md: { width: 174, name: "text-sm", meta: "text-[10px]", num: "h-6 w-6 text-[11px]", crest: 26, role: "text-[10px] px-1.5 py-0.5" },
  lg: { width: 300, name: "text-xl", meta: "text-xs", num: "h-9 w-9 text-base", crest: 42, role: "text-sm px-2 py-1" },
};

export default function Figurina({
  player,
  size = "md",
  href,
  className = "",
  showBack = false,
}: {
  player: LeaguePlayer;
  size?: Size;
  href?: string;
  className?: string;
  showBack?: boolean;
}) {
  const s = SIZES[size];
  const resolved = resolvePlayerImage(player);
  const colors = resolveTeamColors(player.owner);
  const number = displayNumber(player);
  const rare = resolved.rare;

  const usingBack = showBack && resolved.mode === "jerseyFront" && !!player.owner?.jerseyBackUrl;
  const imgSrc = usingBack ? player.owner!.jerseyBackUrl! : resolved.src;
  const isPhoto = resolved.mode === "photo";

  // Carta giocatore applicata (solo figurine non-idolo): rarità che sovrascrive
  // la cornice con l'artwork di rarità. Coesiste con i marcatori "rara" (★/numero
  // oro) e usa palette distinte da idolo/rara per evitare confusione.
  const cardRarity =
    !player.isIdol && player.skinKey && RARITY_ORDER.includes(player.skinKey as CardRarity)
      ? (player.skinKey as CardRarity)
      : null;

  const frameBg = cardRarity
    ? CARD_FRAMES[cardRarity]
    : rare
      ? "linear-gradient(145deg,#F7E7A6 0%,#D4AF37 35%,#B8901F 60%,#F3DE93 100%)"
      : `linear-gradient(150deg, ${colors.primary} 0%, ${colors.secondary} 100%)`;

  const card = player.isIdol ? (
    <IdolShieldCard player={player} size={size} showBack={showBack} />
  ) : (
    <div className="relative select-none" style={{ width: s.width, maxWidth: "100%" }}>
      {/* Cornice: artwork carta (rarità), oro (rara) o colori sociali */}
      <div
        className={`rounded-2xl p-[3px] shadow-md ${rare ? "shadow-oro/40" : ""} ${
          cardRarity === "iconica" ? "shield-holo" : ""
        } ${cardRarity === "speciale" ? "p-[4px]" : ""}`}
        style={{ background: frameBg }}
      >
        <div className="overflow-hidden rounded-[13px] bg-white">
          {/* Area immagine */}
          <div
            className="relative aspect-[100/118] w-full overflow-hidden"
            style={{
              background: cardRarity
                ? "#0b1622"
                : `linear-gradient(160deg, ${colors.primary}, ${colors.secondary})`,
            }}
          >
            {/* Artwork della carta (dietro la sagoma del giocatore) */}
            {cardRarity && <CardArtBackground rarity={cardRarity} />}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgSrc}
              alt={player.name}
              className={`absolute inset-0 h-full w-full ${isPhoto || cardRarity ? "object-contain" : "object-cover"}`}
            />

            {/* Speciale: doppio bordo interno */}
            {cardRarity === "speciale" && (
              <span className="pointer-events-none absolute inset-1 rounded-[10px] border-2 border-fuchsia-300/70" aria-hidden />
            )}
            {/* Chip rarità della carta (palette distinta da idolo/rara) */}
            {cardRarity && (
              <span
                className={`absolute left-1/2 top-1 z-10 -translate-x-1/2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide shadow ${RARITY_META[cardRarity].chip}`}
              >
                {RARITY_META[cardRarity].label}
              </span>
            )}

            {/* Stemma squadra */}
            <span
              className="absolute left-1.5 top-1.5 flex items-center justify-center overflow-hidden rounded-full bg-white/90 shadow ring-2 ring-white"
              style={{ width: s.crest, height: s.crest }}
            >
              <TeamCrest crestUrl={player.owner?.crestUrl} className="h-full w-full" />
            </span>

            {/* Badge ruolo */}
            <span
              className={`absolute right-1.5 top-1.5 rounded-md font-bold text-white shadow ${ROLE_BADGE[player.role]} ${s.role}`}
            >
              {player.role}
            </span>

            {/* Overlay nome + numero */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-2 pb-1.5 pt-6 text-white">
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold ${s.num}`}
                  style={{ background: rare ? "#D4AF37" : "#ffffff", color: "#123D28" }}
                >
                  {number}
                </span>
                <span className={`truncate font-display font-semibold leading-tight ${s.name}`}>
                  {rare && <span className="text-[#F4D77A]">★ </span>}
                  {player.name}
                </span>
              </div>
              <div className={`mt-0.5 truncate text-white/75 ${s.meta}`}>
                {player.club || "—"} · Q{player.quota} · FM {player.fm.toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Effetto lucido */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.1) 22%, rgba(255,255,255,0) 42%, rgba(255,255,255,0) 100%)",
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
