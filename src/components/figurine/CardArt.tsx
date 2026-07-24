// Artwork ORIGINALI (SVG/CSS) delle carte giocatore, uno per rarità. Nessuna
// foto di calciatori reali né scena fotorealistica: solo grafica generata.
// La sagoma del giocatore (maglia/foto) resta leggibile sopra questi sfondi.
import type { CardRarity } from "@/lib/league/cards";

// Cornici per rarità (palette DISTINTE da idolo e "rara").
export const CARD_FRAMES: Record<CardRarity, string> = {
  classica: "linear-gradient(150deg,#7dd3fc,#2563eb 55%,#1e3a8a)",
  speciale: "linear-gradient(150deg,#f0abfc,#c026d3 45%,#701a75)",
  iconica: "linear-gradient(120deg,#5eead4,#22d3ee,#a78bfa,#f0abfc,#5eead4)",
};

// Classica: sfondo pulito, tinta blu con leggere linee diagonali. Statico.
function ClassicaArt() {
  return (
    <span
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          "repeating-linear-gradient(120deg, rgba(255,255,255,0.04) 0 8px, transparent 8px 22px), linear-gradient(160deg,#1e3a5f,#0b1a2e)",
      }}
      aria-hidden
    />
  );
}

// Speciale: energia astratta — raggi magenta rotanti + bagliore pulsante.
function SpecialeArt() {
  const rays =
    "conic-gradient(from 0deg at 50% 45%, rgba(240,120,255,0.35) 0deg, transparent 22deg, rgba(240,120,255,0.35) 44deg, transparent 66deg, rgba(240,120,255,0.35) 88deg, transparent 110deg, rgba(240,120,255,0.35) 132deg, transparent 154deg, rgba(240,120,255,0.35) 176deg, transparent 198deg, rgba(240,120,255,0.35) 220deg, transparent 242deg, rgba(240,120,255,0.35) 264deg, transparent 286deg, rgba(240,120,255,0.35) 308deg, transparent 330deg, rgba(240,120,255,0.35) 360deg)";
  return (
    <span
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ background: "radial-gradient(circle at 50% 45%, #7a1f7a, #2a0a2e 72%)" }}
      aria-hidden
    >
      <span className="card-rays absolute inset-[-35%]" style={{ background: rays }} />
      <span
        className="card-glow absolute inset-[12%] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(245,120,255,0.45), transparent 62%)" }}
      />
    </span>
  );
}

// Iconica: scena illustrativa dello stadio serale — gradinate, folla stilizzata,
// riflettori che si accendono a scaglioni, shimmer olografico e particelle.
function IconicaArt() {
  const crowd: { x: number; y: number }[] = [];
  for (let r = 0; r < 5; r++) {
    for (let i = 0; i < 16; i++) {
      crowd.push({ x: 6 + i * 5.8 + (r % 2) * 2.5, y: 74 + r * 4.2 });
    }
  }
  const colors = ["#5eead4", "#7dd3fc", "#c4b5fd", "#fbcfe8", "#fde68a"];
  return (
    <span className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Cielo serale */}
      <span
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg,#0b2740 0%,#123a52 40%,#0a1622 100%)" }}
      />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 118" preserveAspectRatio="xMidYMid slice">
        {/* alone luminoso sul campo */}
        <ellipse cx="50" cy="96" rx="60" ry="26" fill="#1b5e6e" opacity="0.55" />
        {/* gradinata (arco della folla) */}
        <path d="M-6 118 L-6 82 Q50 60 106 82 L106 118 Z" fill="#0e2233" />
        {/* folla stilizzata */}
        <g>
          {crowd.map((c, i) => (
            <circle key={i} cx={c.x} cy={c.y} r="0.8" fill={colors[i % colors.length]} opacity="0.5" />
          ))}
        </g>
        {/* riflettori: pali + luci (si accendono a scaglioni) */}
        <g stroke="#274b5f" strokeWidth="1.4">
          <line x1="14" y1="40" x2="14" y2="12" />
          <line x1="86" y1="40" x2="86" y2="12" />
        </g>
        <rect className="stadium-light" x="7" y="8" width="14" height="6" rx="1.5" fill="#fde68a" opacity="0.9" style={{ animationDelay: "0s" }} />
        <rect className="stadium-light" x="79" y="8" width="14" height="6" rx="1.5" fill="#fde68a" opacity="0.9" style={{ animationDelay: "1.2s" }} />
        <circle className="stadium-light" cx="14" cy="11" r="7" fill="#fde68a" opacity="0.25" style={{ animationDelay: "0s" }} />
        <circle className="stadium-light" cx="86" cy="11" r="7" fill="#fde68a" opacity="0.25" style={{ animationDelay: "1.2s" }} />
      </svg>
      {/* Shimmer olografico */}
      <span className="shield-shimmer" />
      {/* Particelle */}
      <span className="shield-twinkle absolute left-[22%] top-[26%] h-1 w-1 rounded-full bg-white/90" />
      <span className="shield-twinkle absolute right-[26%] top-[40%] h-1 w-1 rounded-full bg-teal-200/90" style={{ animationDelay: "0.6s" }} />
      <span className="shield-twinkle absolute left-[44%] top-[54%] h-1 w-1 rounded-full bg-white/80" style={{ animationDelay: "1.1s" }} />
    </span>
  );
}

export function CardArtBackground({ rarity }: { rarity: CardRarity }) {
  if (rarity === "iconica") return <IconicaArt />;
  if (rarity === "speciale") return <SpecialeArt />;
  return <ClassicaArt />;
}
