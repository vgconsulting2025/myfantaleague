// Miniatura del giocatore per le liste: foto caricata, oppure un tondino nei
// colori sociali con il numero di maglia.
import type { LeaguePlayer } from "@/lib/league/types";
import { resolveTeamColors, displayNumber } from "@/lib/league/identity";

export default function PlayerThumb({
  player,
  className = "",
}: {
  player: LeaguePlayer;
  className?: string;
}) {
  if (player.imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={player.imageUrl} alt={player.name} className={`object-cover ${className}`} />;
  }
  const colors = resolveTeamColors(player.owner);
  return (
    <span
      className={`flex items-center justify-center font-display text-xs font-bold text-white ${className}`}
      style={{ background: `linear-gradient(150deg, ${colors.primary}, ${colors.secondary})` }}
    >
      {displayNumber(player)}
    </span>
  );
}
