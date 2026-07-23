// Carta premium a SCUDO per il giocatore idolo. Geometria a scudo smerlato in
// alto (due lobi) e punta arrotondata in basso, con DOPPIO BORDO. La cornice
// (scudo, bordi, pattern, ornamenti, animazioni) è indipendente dal contenuto
// centrale: la maglia di default o la foto caricata vengono ritagliate nella
// finestra centrale. Quattro identità di design distinte a ricchezza crescente,
// ciascuna con un dettaglio ornamentale unico nella zona del bordo. CSS puro.
import type { LeaguePlayer } from "@/lib/league/types";
import { resolvePlayerImage, displayNumber } from "@/lib/league/identity";
import { ROLE_BADGE } from "@/components/theme";
import TeamCrest from "@/components/brand/TeamCrest";

type Size = "sm" | "md" | "lg";

// Sagoma scudo in coordinate objectBoundingBox (0..1): top smerlato a due lobi,
// fianchi, punta arrotondata in basso.
const SHIELD_PATH =
  "M0.05,0.12 C0.05,0.02 0.20,0.005 0.27,0.02 C0.36,0.04 0.44,0.085 0.5,0.085 " +
  "C0.56,0.085 0.64,0.04 0.73,0.02 C0.80,0.005 0.95,0.02 0.95,0.12 " +
  "C1,0.14 1,0.18 1,0.5 C1,0.7 0.74,0.9 0.5,1 " +
  "C0.26,0.9 0,0.7 0,0.5 C0,0.18 0,0.14 0.05,0.12 Z";

const S: Record<
  Size,
  { w: number; name: string; num: string; meta: string; medal: number; star: string; crest: number; role: string }
> = {
  sm: { w: 122, name: "text-[10px]", num: "h-4 w-4 text-[9px]", meta: "text-[7px]", medal: 22, star: "text-[7px]", crest: 15, role: "text-[8px] px-1 py-0.5" },
  md: { w: 176, name: "text-[13px]", num: "h-5 w-5 text-[11px]", meta: "text-[9px]", medal: 30, star: "text-[9px]", crest: 20, role: "text-[9px] px-1 py-0.5" },
  lg: { w: 300, name: "text-lg", num: "h-8 w-8 text-sm", meta: "text-[11px]", medal: 50, star: "text-base", crest: 34, role: "text-xs px-1.5 py-0.5" },
};

interface Design {
  label: string;
  stars: number; // 0 => corona
  border: string;
  borderClass?: string;
  filet: string; // filettatura principale (doppio bordo)
  filet2?: string; // seconda filettatura (Argento: ciano)
  pattern: string;
  spinLayer?: string;
  spinClass?: string;
  glowClass: string;
  windowRing: string;
  medalBg: string;
  medalText: string;
  plate: string;
  meta: string;
  sweep?: boolean;
  sparks?: boolean;
  gem?: string; // colore gem al vertice
  shoulders?: "notch" | "lozenge";
  shoulderColor?: string;
  veins?: string; // venature agli angoli
  band?: { css: string; wide?: boolean; glow?: string }; // fascia diagonale
  glints?: boolean; // riflessi puntiformi lungo il bordo
  seqStars?: boolean;
  popMedal?: boolean;
}

const DESIGNS: Record<number, Design> = {
  1: {
    label: "Bronzo",
    stars: 1,
    border: "linear-gradient(155deg,#E9B481 0%,#B87333 45%,#6E4320 100%)",
    filet: "#e9b481",
    pattern:
      "repeating-linear-gradient(45deg, rgba(0,0,0,0.10) 0 10px, rgba(255,255,255,0.04) 10px 20px), linear-gradient(160deg,#8a552c,#5a3719)",
    glowClass: "shield-glow-bronze",
    windowRing: "ring-2 ring-[#e9b481]/70",
    medalBg: "linear-gradient(145deg,#f0c08a,#b87333 60%,#7a4a22)",
    medalText: "text-[#3a2410]",
    plate: "bg-[#5a3719]/85 text-[#f5ddc6] ring-1 ring-[#e9b481]/50",
    meta: "text-[#f0d3b5]/80",
    popMedal: true,
    shoulders: "notch",
    shoulderColor: "#e9b481",
  },
  2: {
    label: "Argento",
    stars: 2,
    border: "linear-gradient(155deg,#F2F6F9 0%,#A6AFB8 45%,#5C6673 100%)",
    filet: "#eef4f8",
    filet2: "#66d0e0",
    pattern:
      "radial-gradient(circle at 50% 18%, rgba(255,255,255,0.22), transparent 55%), repeating-linear-gradient(120deg, rgba(255,255,255,0.06) 0 5px, transparent 5px 13px), linear-gradient(165deg,#727c86,#39414c)",
    glowClass: "shield-glow-silver",
    windowRing: "ring-2 ring-white/70",
    medalBg: "linear-gradient(145deg,#ffffff,#c3cdd6 55%,#7c8794)",
    medalText: "text-[#33404d]",
    plate: "bg-[#39414c]/85 text-white ring-1 ring-white/40",
    meta: "text-white/75",
    sweep: true,
    shoulders: "lozenge",
    shoulderColor: "#cfe9ef",
  },
  3: {
    label: "Verde",
    stars: 3,
    border: "linear-gradient(155deg,#3fae72 0%,#123d28 50%,#0a2015 100%)",
    filet: "#3fae72",
    pattern:
      "radial-gradient(circle at 50% 30%, rgba(63,174,114,0.40), transparent 60%), repeating-linear-gradient(60deg, rgba(255,255,255,0.045) 0 4px, transparent 4px 12px), repeating-linear-gradient(-60deg, rgba(0,0,0,0.10) 0 5px, transparent 5px 15px), linear-gradient(165deg,#124a30,#08160e)",
    spinLayer:
      "conic-gradient(from 0deg at 50% 42%, rgba(63,174,114,0.30) 0deg, transparent 40deg, rgba(63,174,114,0.30) 90deg, transparent 130deg, rgba(63,174,114,0.30) 180deg, transparent 220deg, rgba(63,174,114,0.30) 270deg, transparent 310deg, rgba(63,174,114,0.30) 360deg)",
    spinClass: "shield-spin",
    glowClass: "shield-glow-green",
    windowRing: "ring-2 ring-[#3fae72]/80",
    medalBg: "linear-gradient(145deg,#7ee0a8,#2f7d55 55%,#123d28)",
    medalText: "text-[#062015]",
    plate: "bg-[#0a2015]/88 text-[#d8f3e3] ring-1 ring-[#3fae72]/60",
    meta: "text-[#bfe6cf]/80",
    seqStars: true,
    gem: "#3fae72",
    veins: "#3fae72",
    band: { css: "linear-gradient(90deg,#0a2015,#3fae72,#0a2015)" },
  },
  4: {
    label: "Leggenda",
    stars: 0,
    border:
      "linear-gradient(120deg,#123d28,#d4af37 20%,#2f7d55 40%,#f4e3a0 60%,#123d28 80%,#d4af37 100%)",
    borderClass: "shield-holo",
    filet: "#f4e3a0",
    pattern:
      "repeating-conic-gradient(from 0deg at 50% 40%, rgba(255,255,255,0.05) 0deg 5deg, transparent 5deg 17deg), radial-gradient(circle at 30% 20%, rgba(212,175,55,0.30), transparent 45%), radial-gradient(circle at 72% 28%, rgba(47,125,85,0.36), transparent 50%), radial-gradient(circle at 50% 82%, rgba(212,175,55,0.24), transparent 55%), linear-gradient(165deg,#0d3121,#02100a 72%)",
    spinLayer:
      "conic-gradient(from 0deg at 50% 45%, rgba(212,175,55,0.25) 0deg, transparent 30deg, rgba(47,125,85,0.28) 60deg, transparent 90deg, rgba(212,175,55,0.25) 120deg, transparent 150deg, rgba(47,125,85,0.28) 180deg, transparent 210deg, rgba(212,175,55,0.25) 240deg, transparent 270deg, rgba(47,125,85,0.28) 300deg, transparent 330deg, rgba(212,175,55,0.25) 360deg)",
    spinClass: "shield-spin-rev",
    glowClass: "shield-glow-legend",
    windowRing: "ring-2 ring-oro/80",
    medalBg: "linear-gradient(145deg,#f4e3a0,#d4af37 50%,#8f6f16)",
    medalText: "text-[#2a2107]",
    plate: "bg-[#02100a]/90 text-oro ring-1 ring-oro/60",
    meta: "text-[#f4e3a0]/80",
    sparks: true,
    gem: "#f4e3a0",
    veins: "#f4e3a0",
    band: { css: "linear-gradient(90deg,#123d28,#d4af37,#2f7d55,#f4e3a0,#123d28)", wide: true, glow: "rgba(212,175,55,0.7)" },
    glints: true,
  },
};

function LevelMedal({ d, s }: { d: Design; s: (typeof S)[Size] }) {
  return (
    <span
      className={`absolute left-1/2 top-[1.5%] z-20 flex -translate-x-1/2 items-center justify-center rounded-full shadow-md ring-2 ring-white/70 ${d.popMedal ? "idol-pop" : ""}`}
      style={{ width: s.medal, height: s.medal, background: d.medalBg }}
      title={`Idolo ${d.label}`}
    >
      {d.stars === 0 ? (
        <span className={d.medalText} aria-hidden style={{ fontSize: s.medal * 0.5 }}>
          ♔
        </span>
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
  );
}

// Tacche (Bronzo) o losanghe (Argento) ai due angoli superiori dello scudo.
function ShoulderOrnaments({ kind, color }: { kind: "notch" | "lozenge"; color: string }) {
  const render = (side: "left" | "right") => (
    <span className={`pointer-events-none absolute top-[10.5%] z-10 ${side === "left" ? "left-[7%]" : "right-[7%]"}`}>
      {kind === "lozenge" ? (
        <span className="block h-2 w-2 rotate-45 rounded-[1px] shadow-sm" style={{ background: color }} />
      ) : (
        <span className="flex gap-[2px]">
          <span className="block h-2.5 w-[1.5px] rotate-[18deg] rounded-full" style={{ background: color }} />
          <span className="block h-2.5 w-[1.5px] rotate-[18deg] rounded-full" style={{ background: color }} />
        </span>
      )}
    </span>
  );
  return (
    <>
      {render("left")}
      {render("right")}
    </>
  );
}

// Venature/rami decorativi che si irradiano dal bordo verso l'interno (angoli).
function CornerVeins({ color }: { color: string }) {
  const vein = (side: "left" | "right") => (
    <svg
      className={`pointer-events-none absolute top-[13%] z-10 h-6 w-6 ${side === "left" ? "left-[5%]" : "right-[5%]"}`}
      viewBox="0 0 24 24"
      style={{ transform: side === "right" ? "scaleX(-1)" : undefined, opacity: 0.85 }}
      aria-hidden
    >
      <g stroke={color} strokeWidth="1" fill="none" strokeLinecap="round">
        <path d="M2 2 C 8 5, 10 9, 9 15" />
        <path d="M8 6 L 13 5.5" />
        <path d="M9 10 L 14.5 10.5" />
        <path d="M8.5 13 L 12.5 15.5" />
      </g>
    </svg>
  );
  return (
    <>
      {vein("left")}
      {vein("right")}
    </>
  );
}

// Fascia diagonale sull'angolo in alto a destra (clippata dallo scudo).
function DiagonalBand({ clip, band }: { clip: string; band: NonNullable<Design["band"]> }) {
  return (
    <span className="pointer-events-none absolute inset-0 z-10 overflow-hidden" style={{ clipPath: clip }} aria-hidden>
      <span
        className="absolute rotate-45"
        style={{
          top: band.wide ? "6%" : "8%",
          right: "-24%",
          width: "62%",
          height: band.wide ? "13px" : "6px",
          background: band.css,
          boxShadow: band.glow ? `0 0 9px ${band.glow}` : undefined,
        }}
      />
    </span>
  );
}

// Riflessi puntiformi che luccicano lungo il perimetro (Leggenda).
const GLINTS: { top: string; left?: string; right?: string }[] = [
  { top: "3%", left: "28%" },
  { top: "3%", left: "70%" },
  { top: "22%", left: "3%" },
  { top: "22%", right: "3%" },
  { top: "45%", left: "1%" },
  { top: "45%", right: "1%" },
  { top: "70%", left: "13%" },
  { top: "70%", right: "13%" },
  { top: "88%", left: "40%" },
  { top: "88%", left: "58%" },
];
function BorderGlints() {
  return (
    <>
      {GLINTS.map((g, i) => (
        <span
          key={i}
          className="shield-twinkle pointer-events-none absolute z-10 h-[3px] w-[3px] rounded-full"
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

export default function IdolShieldCard({
  player,
  size = "md",
  showBack = false,
}: {
  player: LeaguePlayer;
  size?: Size;
  showBack?: boolean;
}) {
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
  const patternInset = d.filet2 ? "inset-[5px]" : "inset-[3.5px]";

  return (
    <div className="relative select-none" style={{ width: s.w, maxWidth: "100%" }}>
      {/* Definizione della sagoma scudo (scalabile) */}
      <svg className="absolute h-0 w-0" aria-hidden>
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            <path d={SHIELD_PATH} />
          </clipPath>
        </defs>
      </svg>

      <div className="relative aspect-[100/118] w-full">
        {/* Leggenda: scintille orbitanti (fuori dallo scudo) */}
        {d.sparks && <Sparks />}

        {/* Bordo esterno (glow che segue la sagoma) */}
        <div
          className={`absolute inset-0 ${d.glowClass} ${d.borderClass ?? ""}`}
          style={{ background: d.border, clipPath: clip }}
        />
        {/* Filettatura principale (doppio bordo) */}
        <div className="absolute inset-[2px]" style={{ background: d.filet, clipPath: clip }} />
        {/* Seconda filettatura (Argento) */}
        {d.filet2 && (
          <div className="absolute inset-[3.5px]" style={{ background: d.filet2, clipPath: clip }} />
        )}
        {/* Pattern di sfondo (indipendente dal contenuto) */}
        <div className={`absolute ${patternInset} overflow-hidden`} style={{ background: d.pattern, clipPath: clip }}>
          {d.spinLayer && (
            <span className={`pointer-events-none absolute inset-[-30%] ${d.spinClass ?? ""}`} style={{ background: d.spinLayer }} aria-hidden />
          )}
          {d.sweep && <span className="idol-sweep-band" aria-hidden />}
        </div>

        {/* Ornamenti di bordo */}
        {d.shoulders && <ShoulderOrnaments kind={d.shoulders} color={d.shoulderColor ?? "#fff"} />}
        {d.veins && <CornerVeins color={d.veins} />}
        {d.band && <DiagonalBand clip={clip} band={d.band} />}
        {d.glints && <BorderGlints />}
        {d.gem && (
          <span
            className="pointer-events-none absolute left-1/2 top-[85%] z-10 h-2.5 w-2.5 -translate-x-1/2 rotate-45 rounded-[2px]"
            style={{ background: d.gem, boxShadow: `0 0 6px ${d.gem}` }}
            aria-hidden
          />
        )}

        {/* Finestra centrale: mostra la maglia/foto PER INTERO (object-contain),
            centrata, con matte neutro ai margini. Contenuto indipendente dalla
            cornice; funziona con qualsiasi proporzione di foto caricata. */}
        <div
          className={`absolute left-[21%] right-[21%] top-[13%] h-[47%] overflow-hidden rounded-[10px] ${d.windowRing}`}
          style={{ background: "linear-gradient(160deg,#12201a,#0a120d)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgSrc} alt={player.name} className="absolute inset-0 h-full w-full object-contain" />
          <span
            className="absolute left-1 top-1 flex items-center justify-center overflow-hidden rounded-full bg-white/90 shadow ring-1 ring-white"
            style={{ width: s.crest, height: s.crest }}
          >
            <TeamCrest crestUrl={player.owner?.crestUrl} className="h-full w-full" />
          </span>
          <span className={`absolute right-1 top-1 rounded font-bold text-white shadow ${ROLE_BADGE[player.role]} ${s.role}`}>
            {player.role}
          </span>
        </div>

        {/* Medaglia del livello */}
        <LevelMedal d={d} s={s} />

        {/* Numero (badge) all'angolo inferiore della finestra */}
        <span
          className={`absolute left-[18%] top-[54%] z-20 inline-flex items-center justify-center rounded-full font-display font-bold shadow ring-2 ring-white/80 ${s.num}`}
          style={{ background: rare ? "#D4AF37" : "#ffffff", color: "#123D28" }}
        >
          {number}
        </span>

        {/* Targa nome + meta (indipendente dal contenuto) */}
        <div className="absolute inset-x-[11%] top-[61%] z-10 text-center">
          <div className={`mx-auto rounded-md px-1.5 py-0.5 font-display font-semibold leading-tight ${d.plate} ${s.name}`}>
            {rare && <span className="text-[#F4D77A]">★ </span>}
            <span className="truncate">{player.name}</span>
          </div>
          <div className={`mt-0.5 truncate font-semibold uppercase tracking-wide ${d.meta} ${s.meta}`}>
            Idolo {d.label}
          </div>
          <div className={`truncate ${d.meta} ${s.meta}`}>
            {player.club || "—"} · Q{player.quota} · FM {player.fm.toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  );
}
