// Carta premium a SCUDO per il giocatore idolo — stile "carta premium a scudo":
// forma a scudo con top a doppio lobo che si incontra in una piccola punta verso
// l'alto al centro, fianchi dritti, base a punta arrotondata; DOPPIO BORDO sottile
// (esterno chiaro + interno distanziato, nel metallo del livello); SUPERFICIE
// chiara con venature marmo appena percettibili; NASTRO diagonale metallico con
// bordo inferiore frangiato; DIVISORI (linea immagine/testo + trattino accanto al
// nome). Shimmer olografico animato sopra nastro e superficie. Costruito da zero
// in SVG/CSS. Dimensioni IDENTICHE tra i 4 livelli e coerenti con le figurine
// normali; solo lo stile cambia (colori, pattern, ornamenti, animazioni).
import type { LeaguePlayer } from "@/lib/league/types";
import { resolvePlayerImage, displayNumber } from "@/lib/league/identity";
import { ROLE_BADGE } from "@/components/theme";
import TeamCrest from "@/components/brand/TeamCrest";

type Size = "sm" | "md" | "lg";

// Sagoma scudo (objectBoundingBox 0..1): due lobi in alto con piccola punta
// centrale verso l'alto, fianchi dritti, base a punta arrotondata.
const SHIELD_PATH =
  "M0.05,0.15 C0.05,0.05 0.19,0.02 0.26,0.04 C0.34,0.055 0.40,0.085 0.44,0.085 " +
  "L0.5,0.055 L0.56,0.085 C0.60,0.085 0.66,0.055 0.74,0.04 C0.81,0.02 0.95,0.05 0.95,0.15 " +
  "C1,0.17 1,0.21 1,0.52 C1,0.72 0.74,0.9 0.5,1 C0.26,0.9 0,0.72 0,0.52 C0,0.21 0,0.17 0.05,0.15 Z";

// Bordo inferiore leggermente frangiato del nastro (piccole punte irregolari):
// corpo pieno fino a ~80%, poi denti bassi tra 80% e 100%.
const RIBBON_CLIP = (() => {
  const pts = ["0% 0%", "100% 0%"];
  const n = 22;
  for (let i = 0; i <= n; i++) {
    const x = 100 - (i / n) * 100;
    const y = i % 2 === 0 ? 100 : 80 + ((i * 41) % 9);
    pts.push(`${x.toFixed(1)}% ${Math.round(y)}%`);
  }
  return `polygon(${pts.join(",")})`;
})();

// DIMENSIONI IDENTICHE tra i livelli; larghezze allineate alle figurine normali.
const S: Record<
  Size,
  { w: number; name: string; num: string; meta: string; medal: number; star: string; crest: number; role: string }
> = {
  sm: { w: 122, name: "text-[10px]", num: "h-4 w-4 text-[9px]", meta: "text-[7px]", medal: 20, star: "text-[7px]", crest: 14, role: "text-[8px] px-1 py-0.5" },
  md: { w: 174, name: "text-[13px]", num: "h-5 w-5 text-[11px]", meta: "text-[9px]", medal: 28, star: "text-[9px]", crest: 19, role: "text-[9px] px-1 py-0.5" },
  lg: { w: 300, name: "text-lg", num: "h-8 w-8 text-sm", meta: "text-[11px]", medal: 48, star: "text-base", crest: 33, role: "text-xs px-1.5 py-0.5" },
};

interface Design {
  label: string;
  stars: number; // 0 => corona
  metalLight: string; // bordo esterno (chiaro)
  metal: string; // bordo interno
  surface: string; // superficie chiara (marmo)
  vein: string; // colore venature
  ribbon: string; // gradiente metallico del nastro (chiaro-scuro-chiaro)
  ribbonHolo?: boolean; // nastro olografico animato (Leggenda)
  ribbonSweep?: boolean; // riflesso periodico sul nastro (Argento+)
  surfaceShimmer?: boolean; // shimmer sulla superficie (Leggenda)
  glowClass: string;
  windowMatte: string;
  windowRing: string;
  textMain: string;
  textMeta: string;
  tick: string; // colore trattino/divisore
  medalBg: string;
  medalText: string;
  medalRing?: string;
  seqStars?: boolean;
  popMedal?: boolean;
  glints?: boolean;
  sparks?: boolean;
}

const DESIGNS: Record<number, Design> = {
  // 1 · BRONZO — più opaco e semplice.
  1: {
    label: "Bronzo",
    stars: 1,
    metalLight: "#e9c9a8",
    metal: "#a9662f",
    surface: "linear-gradient(160deg,#f4e7d6 0%,#e7d3bb 100%)",
    vein: "#c9ad86",
    ribbon: "linear-gradient(180deg,#d19a63 0%,#8a5626 52%,#c88b4e 100%)",
    glowClass: "shield-glow-bronze",
    windowMatte: "linear-gradient(160deg,#efe0cd,#e2ceb4)",
    windowRing: "ring-1 ring-[#a9662f]/40",
    textMain: "text-[#4a2e14]",
    textMeta: "text-[#7a5533]",
    tick: "#a9662f",
    medalBg: "linear-gradient(145deg,#f0c08a,#b87333 60%,#7a4a22)",
    medalText: "text-[#3a2410]",
    popMedal: true,
  },
  // 2 · ARGENTO — effetto metallico più freddo, riflesso animato.
  2: {
    label: "Argento",
    stars: 2,
    metalLight: "#f2f7fa",
    metal: "#7f8b96",
    surface: "linear-gradient(160deg,#f7f9fb 0%,#e4e9ee 100%)",
    vein: "#bcc6cf",
    ribbon: "linear-gradient(180deg,#f2f9fd 0%,#8fa0ac 52%,#eef6fb 100%)",
    ribbonSweep: true,
    glowClass: "shield-glow-silver",
    windowMatte: "linear-gradient(160deg,#eef2f6,#dde4ea)",
    windowRing: "ring-1 ring-[#7f8b96]/40",
    textMain: "text-[#33404d]",
    textMeta: "text-[#5b6673]",
    tick: "#7f8b96",
    medalBg: "linear-gradient(145deg,#ffffff,#c3cdd6 55%,#7c8794)",
    medalText: "text-[#33404d]",
  },
  // 3 · VERDE IDOLO — nastro smeraldo, glow pulsante, stelle in sequenza.
  3: {
    label: "Verde",
    stars: 3,
    metalLight: "#8fe3b0",
    metal: "#2f7d55",
    surface: "linear-gradient(160deg,#eef7f1 0%,#d9ecdf 100%)",
    vein: "#a7cfb7",
    ribbon: "linear-gradient(180deg,#7ee0a8 0%,#186e42 52%,#7ee0a8 100%)",
    ribbonSweep: true,
    glowClass: "shield-glow-green",
    windowMatte: "linear-gradient(160deg,#e6f2ea,#d2e8db)",
    windowRing: "ring-1 ring-[#2f7d55]/45",
    textMain: "text-[#123d28]",
    textMeta: "text-[#2f6b4a]",
    tick: "#2f7d55",
    medalBg: "linear-gradient(145deg,#7ee0a8,#2f7d55 55%,#123d28)",
    medalText: "text-[#062015]",
    seqStars: true,
  },
  // 4 · LEGGENDA — marmo dorato, nastro bicolore olografico, shimmer, riflessi.
  4: {
    label: "Leggenda",
    stars: 0,
    metalLight: "#f9efc6",
    metal: "#c99f2a",
    surface: "linear-gradient(160deg,#f9f3e0 0%,#efe3c2 55%,#f5ecd0 100%)",
    vein: "#dcc78d",
    ribbon: "linear-gradient(110deg,#f7ecc0 0%,#c9a12a 32%,#2f7d55 55%,#d4af37 78%,#f7ecc0 100%)",
    ribbonHolo: true,
    ribbonSweep: true,
    surfaceShimmer: true,
    glowClass: "shield-glow-legend",
    windowMatte: "linear-gradient(160deg,#f3ead1,#e8d9b4)",
    windowRing: "ring-1 ring-[#c99f2a]/50",
    textMain: "text-[#5a4410]",
    textMeta: "text-[#8a6a1a]",
    tick: "#c99f2a",
    medalBg: "radial-gradient(circle at 50% 38%,#123d28,#02100a)",
    medalText: "text-oro",
    medalRing: "ring-[#e9cd6e]",
    glints: true,
    sparks: true,
  },
};

// Venature marmo: poche linee ondulate chiare, appena percettibili.
function MarbleVeins({ color }: { color: string }) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 118"
      preserveAspectRatio="none"
      style={{ opacity: 0.35 }}
      aria-hidden
    >
      <g stroke={color} strokeWidth="0.5" fill="none" strokeLinecap="round">
        <path d="M-4 22 C 22 16, 40 34, 62 26 S 96 40, 108 30" />
        <path d="M-4 52 C 26 46, 44 66, 70 56 S 100 66, 110 60" />
        <path d="M-4 84 C 20 80, 46 94, 68 86 S 98 96, 110 90" />
        <path d="M28 -4 C 33 26, 24 52, 38 82" opacity="0.7" />
        <path d="M74 -4 C 70 24, 82 50, 70 84" opacity="0.6" />
      </g>
    </svg>
  );
}

function GLINTS() {
  const pts: { top: string; left?: string; right?: string }[] = [
    { top: "4%", left: "30%" },
    { top: "4%", left: "68%" },
    { top: "22%", left: "3%" },
    { top: "22%", right: "3%" },
    { top: "46%", left: "1%" },
    { top: "46%", right: "1%" },
    { top: "70%", left: "13%" },
    { top: "70%", right: "13%" },
    { top: "88%", left: "42%" },
    { top: "88%", left: "56%" },
  ];
  return (
    <>
      {pts.map((g, i) => (
        <span
          key={i}
          className="shield-twinkle pointer-events-none absolute z-[6] h-[3px] w-[3px] rounded-full"
          style={{
            top: g.top,
            left: g.left,
            right: g.right,
            background: "radial-gradient(circle,#fff,#f4e3a0 60%,transparent 72%)",
            boxShadow: "0 0 4px rgba(244,227,160,0.9)",
            animationDelay: `${(i % 5) * 0.35}s`,
          }}
          aria-hidden
        />
      ))}
    </>
  );
}

// Corona regale premium (Leggenda): base ad anello, 5 punte (triangolari alte
// alternate a rotonde più basse), gemme sferiche sulle punte alte, fascia con
// rombi, gradiente oro con alta luce/ombra, gemme verdi (bicolore verde-oro).
export function CrownMark({ uid, size }: { uid: string; size: number }) {
  const gGold = `cg-${uid}`;
  const gGem = `cgm-${uid}`;
  const gems: [number, number][] = [
    [9, 6.5],
    [24, 3],
    [39, 6.5],
  ];
  return (
    <svg
      width={size}
      height={size * 0.82}
      viewBox="0 0 48 39"
      aria-hidden
      style={{ filter: "drop-shadow(0 0 1.6px rgba(212,175,55,0.95))", overflow: "visible" }}
    >
      <defs>
        <linearGradient id={gGold} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fdf6de" />
          <stop offset="34%" stopColor="#eacd6e" />
          <stop offset="66%" stopColor="#c99f2a" />
          <stop offset="100%" stopColor="#8a6a14" />
        </linearGradient>
        <radialGradient id={gGem} cx="36%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#c8f6da" />
          <stop offset="52%" stopColor="#2f9d5f" />
          <stop offset="100%" stopColor="#0e4529" />
        </radialGradient>
      </defs>

      {/* Corpo: 5 punte (tri alte 1/3/5, rotonde basse 2/4), punta centrale più alta */}
      <path
        d="M7,26 L9,8 L13,18 Q16.5,11 20,18 L24,4 L28,18 Q31.5,11 35,18 L39,8 L41,26 Z"
        fill={`url(#${gGold})`}
        stroke="#7a5a12"
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
      {/* Alte luci sui bordi interni delle punte (tridimensionalità) */}
      <path
        d="M9,9.5 L10.6,17 M24,5.5 L24,17 M39,9.5 L37.4,17"
        stroke="#fdf6de"
        strokeWidth="0.6"
        strokeLinecap="round"
        opacity="0.55"
        fill="none"
      />
      {/* Fascia/base */}
      <rect x="6" y="25" width="36" height="9.4" rx="1.7" fill={`url(#${gGold})`} stroke="#7a5a12" strokeWidth="0.7" />
      {/* Incisioni: piccoli rombi (gemme verdi) sulla fascia */}
      {[12, 18, 24, 30, 36].map((cx) => (
        <rect
          key={cx}
          x={cx - 1.4}
          y={28.2}
          width="2.8"
          height="2.8"
          transform={`rotate(45 ${cx} 29.6)`}
          fill={`url(#${gGem})`}
          stroke="#0e4529"
          strokeWidth="0.35"
        />
      ))}
      {/* Rim inferiore in ombra */}
      <rect x="6" y="32.4" width="36" height="1.5" rx="0.6" fill="#8a6a14" opacity="0.7" />
      {/* Gemme sferiche sulle punte alte */}
      {gems.map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="2.5" fill={`url(#${gGem})`} stroke="#0e4529" strokeWidth="0.4" />
          <circle cx={cx - 0.85} cy={cy - 0.85} r="0.75" fill="#eafff2" opacity="0.9" />
        </g>
      ))}
    </svg>
  );
}

function Sparks() {
  return (
    <>
      <span className="idol-orbit" aria-hidden>
        <span className="idol-spark" style={{ top: "2%", left: "48%" }} />
        <span className="idol-spark" style={{ top: "45%", left: "1%" }} />
        <span className="idol-spark" style={{ top: "60%", right: "6%" }} />
      </span>
      <span className="idol-orbit rev" aria-hidden>
        <span className="idol-spark" style={{ top: "20%", right: "2%" }} />
        <span className="idol-spark" style={{ bottom: "18%", left: "12%" }} />
      </span>
    </>
  );
}

export default function IdolShieldCard({ player, size = "md", showBack = false }: { player: LeaguePlayer; size?: Size; showBack?: boolean }) {
  const s = S[size];
  const level = player.idolProgress?.level ?? 1;
  const d = DESIGNS[level] ?? DESIGNS[1];
  const resolved = resolvePlayerImage(player);
  const usingBack = showBack && resolved.mode === "jerseyFront" && !!player.owner?.jerseyBackUrl;
  const imgSrc = usingBack ? player.owner!.jerseyBackUrl! : resolved.src;
  const number = displayNumber(player);
  const rare = resolved.rare;

  const clipId = `shield-${player.id}`;
  const clip = `url(#${clipId})`;

  return (
    <div className="relative select-none" style={{ width: s.w, maxWidth: "100%" }}>
      <svg className="absolute h-0 w-0" aria-hidden>
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            <path d={SHIELD_PATH} />
          </clipPath>
        </defs>
      </svg>

      <div className="relative aspect-[100/118] w-full">
        {d.sparks && <Sparks />}

        {/* Doppio bordo sottile: linea esterna chiara + intercapedine + linea interna */}
        <div className={`absolute inset-0 ${d.glowClass}`} style={{ background: d.metalLight, clipPath: clip }} />
        <div className="absolute inset-[1.5px]" style={{ background: d.surface, clipPath: clip }} />
        <div className="absolute inset-[3px]" style={{ background: d.metal, clipPath: clip }} />

        {/* Superficie principale (marmo) */}
        <div className="absolute inset-[4.5px] overflow-hidden" style={{ background: d.surface, clipPath: clip }}>
          <MarbleVeins color={d.vein} />
          {d.surfaceShimmer && <span className="shield-shimmer slow" aria-hidden />}

          {/* Nastro diagonale metallico con bordo inferiore frangiato */}
          <span className="pointer-events-none absolute left-[-12%] right-[-12%] top-[8%] z-[5] h-[13%] -rotate-[11deg] overflow-hidden">
            <span
              className={`absolute inset-0 ${d.ribbonHolo ? "shield-holo" : ""}`}
              style={{ background: d.ribbon, clipPath: RIBBON_CLIP, backgroundSize: d.ribbonHolo ? "300% 100%" : undefined }}
            />
            {d.ribbonSweep && (
              <span className="absolute inset-0" style={{ clipPath: RIBBON_CLIP }}>
                <span className="shield-shimmer" aria-hidden />
              </span>
            )}
          </span>

          {/* Divisore orizzontale immagine/testo */}
          <span
            className="pointer-events-none absolute left-[14%] right-[14%] top-[57%] z-[6] h-px"
            style={{ background: d.tick, opacity: 0.55 }}
            aria-hidden
          />
        </div>

        {/* Riflessi puntiformi lungo il bordo (Leggenda) */}
        {d.glints && <GLINTS />}

        {/* Medaglia del livello, centrata sul nastro */}
        <span
          className={`absolute left-1/2 top-[6%] z-20 flex -translate-x-1/2 items-center justify-center rounded-full shadow-md ring-2 ${d.medalRing ?? "ring-white/80"} ${d.popMedal ? "idol-pop" : ""}`}
          style={{ width: s.medal, height: s.medal, background: d.medalBg }}
          title={`Idolo ${d.label}`}
        >
          {d.stars === 0 ? (
            <CrownMark uid={player.id} size={s.medal * 0.78} />
          ) : (
            <span className={`flex items-center gap-[1px] ${d.medalText} ${s.star} ${d.seqStars ? "idol-star-seq" : ""}`}>
              {Array.from({ length: d.stars }).map((_, i) => (
                <span key={i} aria-hidden>
                  ★
                </span>
              ))}
            </span>
          )}
        </span>

        {/* Finestra immagine (contain, immagine intera) */}
        <div
          className={`absolute left-[17%] right-[17%] top-[25%] h-[31%] overflow-hidden rounded-[8px] ${d.windowRing}`}
          style={{ background: d.windowMatte }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgSrc} alt={player.name} className="absolute inset-0 h-full w-full object-contain" />
          <span
            className="absolute left-0.5 top-0.5 flex items-center justify-center overflow-hidden rounded-full bg-white/90 shadow ring-1 ring-white"
            style={{ width: s.crest, height: s.crest }}
          >
            <TeamCrest crestUrl={player.owner?.crestUrl} className="h-full w-full" />
          </span>
          <span className={`absolute right-0.5 top-0.5 rounded font-bold text-white shadow ${ROLE_BADGE[player.role]} ${s.role}`}>
            {player.role}
          </span>
        </div>

        {/* Numero all'angolo inferiore della finestra */}
        <span
          className={`absolute left-[22%] top-[49%] z-20 inline-flex items-center justify-center rounded-full font-display font-bold shadow ring-2 ring-white/90 ${s.num}`}
          style={{ background: rare ? "#D4AF37" : "#ffffff", color: "#123D28" }}
        >
          {number}
        </span>

        {/* Zona testo (sotto il divisore) su superficie chiara */}
        <div className="absolute inset-x-[13%] top-[60%] z-10 text-center">
          <div className={`flex items-center justify-center gap-1 font-display font-semibold leading-tight ${d.textMain} ${s.name}`}>
            {rare && <span className="text-[#B8901F]">★</span>}
            {/* trattino verticale come separatore minimale accanto al nome */}
            <span className="inline-block h-3 w-px" style={{ background: d.tick }} aria-hidden />
            <span className="truncate">{player.name}</span>
          </div>
          <div className={`mt-0.5 truncate font-semibold uppercase tracking-wide ${d.textMeta} ${s.meta}`}>
            Idolo {d.label}
          </div>
          <div className={`truncate ${d.textMeta} ${s.meta}`}>
            {player.club || "—"} · Q{player.quota} · FM {player.fm.toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  );
}
