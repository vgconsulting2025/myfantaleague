// Avatar caricaturale ORIGINALE, disegnato in SVG componendo tratti da set
// predefiniti, scelti in modo deterministico dal nome (vedi lib/figurine/traits).
// Nessuna foto, nessuna caricatura di persone reali: personaggi di fantasia.
import type { ReactNode } from "react";
import { pickTraits } from "@/lib/figurine/traits";
import { getClubColors } from "@/lib/league/clubColors";

const SKIN = ["#F3D2B3", "#EAC29A", "#D9A66E", "#C68A4E", "#A96C3C", "#8A5A2B", "#5E3B1E"];
const HAIR = ["#221E1B", "#3B2A22", "#5A3A25", "#8A4B2A", "#C9A15A", "#B7B2AD", "#0E0E0E", "#6E4E33"];

const outline = { stroke: "#0000001f", strokeWidth: 1 };

function Face(i: number, skin: string): ReactNode {
  const c = { fill: skin, ...outline };
  switch (i) {
    case 0:
      return <ellipse cx={50} cy={50} rx={28} ry={29} {...c} />;
    case 1:
      return <ellipse cx={50} cy={49} rx={25} ry={31} {...c} />;
    case 2:
      return <ellipse cx={50} cy={50} rx={23} ry={34} {...c} />;
    case 3:
      return <ellipse cx={50} cy={51} rx={31} ry={27} {...c} />;
    case 4:
      return <rect x={22} y={22} width={56} height={58} rx={18} {...c} />;
    case 5:
      return (
        <path
          d="M50 83 C 39 75 22 62 22 44 C 22 29 35 21 50 24 C 65 21 78 29 78 44 C 78 62 61 75 50 83 Z"
          {...c}
        />
      );
    case 6:
      return (
        <path
          d="M50 17 C 67 26 80 40 78 51 C 76 63 60 81 50 84 C 40 81 24 63 22 51 C 20 40 33 26 50 17 Z"
          {...c}
        />
      );
    default:
      return <rect x={20} y={24} width={60} height={56} rx={26} {...c} />;
  }
}

function Hair(i: number, color: string): ReactNode {
  const f = { fill: color };
  switch (i) {
    case 0:
      return null; // pelato
    case 1:
      return <path d="M24 44 C 26 26 40 18 50 18 C 60 18 74 26 76 44 C 70 34 60 31 50 31 C 40 31 30 34 24 44 Z" {...f} />;
    case 2:
      return <path d="M22 46 C 22 25 38 15 50 15 C 62 15 78 25 78 46 C 70 35 60 32 50 32 C 40 32 30 35 22 46 Z" {...f} />;
    case 3:
      return (
        <g {...f}>
          {[
            [30, 26, 10],
            [42, 20, 11],
            [54, 19, 11],
            [66, 24, 10],
            [24, 37, 9],
            [76, 37, 9],
            [50, 15, 12],
          ].map(([x, y, r], k) => (
            <circle key={k} cx={x} cy={y} r={r} />
          ))}
        </g>
      );
    case 4:
      return <path d="M20 48 C 20 24 40 14 52 16 C 68 18 80 30 78 48 C 74 40 70 30 58 28 C 44 26 34 34 30 42 C 27 47 24 48 20 48 Z" {...f} />;
    case 5:
      return <path d="M43 10 C 48 5 52 5 57 10 L 57 34 L 43 34 Z" {...f} />;
    case 6:
      return (
        <path
          d="M18 58 C 15 30 34 13 50 13 C 66 13 85 30 82 58 L 74 58 L 74 30 C 66 25 58 25 50 25 C 42 25 34 25 26 30 L 26 58 Z"
          {...f}
        />
      );
    default:
      return <path d="M22 44 C 24 24 40 15 54 16 C 68 17 77 27 78 42 C 70 34 60 31 50 31 C 42 31 36 32 30 36 C 27 38 25 41 22 44 Z" {...f} />;
  }
}

function Expression(i: number): ReactNode {
  const eye = "#1E1B18";
  const brow = "#3a2f27";
  const dotEyes = (
    <>
      <circle cx={40} cy={47} r={2.4} fill={eye} />
      <circle cx={60} cy={47} r={2.4} fill={eye} />
    </>
  );
  switch (i) {
    case 0:
      return (
        <g>
          {dotEyes}
          <path d="M35 40 L 45 40" stroke={brow} strokeWidth={1.6} strokeLinecap="round" />
          <path d="M55 40 L 65 40" stroke={brow} strokeWidth={1.6} strokeLinecap="round" />
          <path d="M44 64 L 56 64" stroke="#8a4a3c" strokeWidth={2} strokeLinecap="round" />
        </g>
      );
    case 1:
      return (
        <g>
          {dotEyes}
          <path d="M35 40 L 45 40M55 40 L 65 40" stroke={brow} strokeWidth={1.6} strokeLinecap="round" />
          <path d="M43 62 Q 50 69 57 62" stroke="#8a4a3c" strokeWidth={2} fill="none" strokeLinecap="round" />
        </g>
      );
    case 2:
      return (
        <g>
          {dotEyes}
          <path d="M35 38 Q 40 36 45 39M55 39 Q 60 36 65 38" stroke={brow} strokeWidth={1.6} fill="none" strokeLinecap="round" />
          <path d="M42 61 Q 50 72 58 61 Z" fill="#7c3b30" />
          <path d="M44 62 Q 50 66 56 62" fill="#ffffff" />
        </g>
      );
    case 3:
      return (
        <g>
          <rect x={37} y={46} width={6} height={2.6} rx={1.3} fill={eye} />
          <rect x={57} y={46} width={6} height={2.6} rx={1.3} fill={eye} />
          <path d="M35 41 L 45 39M55 39 L 65 41" stroke={brow} strokeWidth={1.8} strokeLinecap="round" />
          <path d="M45 64 L 55 64" stroke="#8a4a3c" strokeWidth={2} strokeLinecap="round" />
        </g>
      );
    case 4:
      return (
        <g>
          <circle cx={40} cy={47} r={3.4} fill="#fff" stroke={eye} strokeWidth={1.2} />
          <circle cx={60} cy={47} r={3.4} fill="#fff" stroke={eye} strokeWidth={1.2} />
          <circle cx={40} cy={47} r={1.5} fill={eye} />
          <circle cx={60} cy={47} r={1.5} fill={eye} />
          <path d="M34 38 Q 40 35 46 38M54 38 Q 60 35 66 38" stroke={brow} strokeWidth={1.6} fill="none" strokeLinecap="round" />
          <ellipse cx={50} cy={65} rx={3.5} ry={4} fill="#7c3b30" />
        </g>
      );
    case 5:
      return (
        <g>
          {dotEyes}
          <path d="M35 41 L 45 39M55 40 L 65 40" stroke={brow} strokeWidth={1.6} strokeLinecap="round" />
          <path d="M43 64 Q 50 67 58 61" stroke="#8a4a3c" strokeWidth={2} fill="none" strokeLinecap="round" />
        </g>
      );
    case 6:
      return (
        <g>
          <path d="M37 47 L 43 47" stroke={eye} strokeWidth={2} strokeLinecap="round" />
          <circle cx={60} cy={47} r={2.4} fill={eye} />
          <path d="M35 40 L 45 40M55 40 L 65 40" stroke={brow} strokeWidth={1.6} strokeLinecap="round" />
          <path d="M43 62 Q 50 68 57 62" stroke="#8a4a3c" strokeWidth={2} fill="none" strokeLinecap="round" />
        </g>
      );
    default:
      return (
        <g>
          {dotEyes}
          <path d="M34 39 L 45 42M55 42 L 66 39" stroke={brow} strokeWidth={1.9} strokeLinecap="round" />
          <path d="M44 64 L 56 64" stroke="#8a4a3c" strokeWidth={2.2} strokeLinecap="round" />
        </g>
      );
  }
}

function FacialHair(i: number, color: string): ReactNode {
  const f = { fill: color };
  switch (i) {
    case 0:
      return null;
    case 1: // baffi
      return <path d="M42 60 Q 50 57 58 60 Q 50 63 42 60 Z" {...f} />;
    case 2: // pizzetto
      return (
        <g {...f}>
          <path d="M43 60 Q 50 58 57 60 Q 50 62 43 60 Z" />
          <path d="M46 68 Q 50 74 54 68 Q 50 70 46 68 Z" />
        </g>
      );
    case 3: // barba piena
      return (
        <path
          d="M27 52 C 30 74 40 84 50 84 C 60 84 70 74 73 52 C 68 60 60 63 50 63 C 40 63 32 60 27 52 Z"
          fill={color}
          opacity={0.92}
        />
      );
    case 4: // barba incolta
      return (
        <g fill={color} opacity={0.4}>
          {[
            [36, 66], [42, 70], [48, 72], [54, 71], [60, 67], [33, 60], [66, 60],
            [40, 66], [50, 73], [58, 70], [45, 69], [55, 69],
          ].map(([x, y], k) => (
            <circle key={k} cx={x} cy={y} r={1.5} />
          ))}
        </g>
      );
    case 5: // pizzo sotto labbro
      return <path d="M47 67 Q 50 71 53 67 Q 50 69 47 67 Z" {...f} />;
    case 6: // basette
      return (
        <g {...f}>
          <path d="M26 48 L 30 48 L 30 62 L 27 58 Z" />
          <path d="M74 48 L 70 48 L 70 62 L 73 58 Z" />
        </g>
      );
    default: // contorno mandibola
      return (
        <path
          d="M29 54 C 32 72 41 82 50 82 C 59 82 68 72 71 54"
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
        />
      );
  }
}

function Accessory(i: number, primary: string, secondary: string): ReactNode {
  switch (i) {
    case 0:
      return null;
    case 1: // fascetta
      return (
        <path d="M23 36 C 32 30 68 30 77 36 L 77 41 C 68 35 32 35 23 41 Z" fill={secondary} stroke="#00000022" strokeWidth={0.8} />
      );
    case 2: // occhiali
      return (
        <g fill="none" stroke="#20242c" strokeWidth={1.6}>
          <circle cx={40} cy={47} r={6} />
          <circle cx={60} cy={47} r={6} />
          <path d="M46 47 L 54 47" />
        </g>
      );
    case 3: // colletto rialzato
      return (
        <g fill={secondary} stroke="#00000022" strokeWidth={0.8}>
          <path d="M38 84 L 46 90 L 44 82 Z" />
          <path d="M62 84 L 54 90 L 56 82 Z" />
        </g>
      );
    case 4: // orecchino
      return <circle cx={24} cy={56} r={2.2} fill="none" stroke="#E7C531" strokeWidth={1.6} />;
    case 5: // fascia sportiva spessa
      return (
        <path d="M22 34 C 32 27 68 27 78 34 L 78 42 C 68 34 32 34 22 42 Z" fill={primary} stroke="#00000022" strokeWidth={0.8} />
      );
    case 6: // visiera
      return (
        <g>
          <path d="M22 40 C 32 30 68 30 78 40 L 78 34 C 68 26 32 26 22 34 Z" fill={primary} />
          <path d="M20 40 Q 50 46 20 46 Z" fill={secondary} opacity={0.9} />
        </g>
      );
    default: // colletto abbottonato
      return (
        <g fill={secondary} stroke="#00000022" strokeWidth={0.8}>
          <path d="M42 86 L 50 96 L 46 84 Z" />
          <path d="M58 86 L 50 96 L 54 84 Z" />
        </g>
      );
  }
}

export default function PlayerAvatar({
  name,
  club,
  className,
}: {
  name: string;
  club: string;
  className?: string;
}) {
  const t = pickTraits(name);
  const skin = SKIN[t.skin % SKIN.length];
  const hairColor = HAIR[t.hairColor % HAIR.length];
  const { primary, secondary } = getClubColors(club);

  return (
    <svg
      viewBox="0 0 100 118"
      className={className}
      role="img"
      aria-label={`Figurina di ${name}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* orecchie */}
      <ellipse cx={22} cy={52} rx={4} ry={6} fill={skin} {...outline} />
      <ellipse cx={78} cy={52} rx={4} ry={6} fill={skin} {...outline} />
      {/* collo */}
      <rect x={43} y={76} width={14} height={16} rx={4} fill={skin} />
      {/* maglia */}
      <path d="M16 118 L 21 95 C 30 87 40 85 50 85 C 60 85 70 87 79 95 L 84 118 Z" fill={primary} />
      <path d="M42 85 L 50 95 L 58 85 C 55 89 45 89 42 85 Z" fill={secondary} />
      <path d="M21 95 L 19 110 L 26 110 L 29 97 Z" fill={secondary} opacity={0.85} />
      <path d="M79 95 L 81 110 L 74 110 L 71 97 Z" fill={secondary} opacity={0.85} />
      {/* viso */}
      {Face(t.face, skin)}
      {/* naso */}
      <path d="M50 50 Q 47 57 50 58 Q 52 58 52 57" fill="none" stroke="#00000030" strokeWidth={1.4} strokeLinecap="round" />
      {/* capelli */}
      {Hair(t.hair, hairColor)}
      {/* espressione */}
      {Expression(t.expr)}
      {/* barba/baffi */}
      {FacialHair(t.facial, hairColor)}
      {/* accessorio */}
      {Accessory(t.accessory, primary, secondary)}
    </svg>
  );
}
