// Maglia generata in SVG nei colori sociali (usata come immagine di default del
// giocatore quando la squadra non ha caricato una maglia).
export default function JerseyMark({
  primary,
  secondary,
  className,
}: {
  primary: string;
  secondary: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 118"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <rect width="100" height="118" fill={primary} opacity="0.14" />
      {/* maniche */}
      <path d="M22 32 L4 50 L15 66 L30 52 Z" fill={secondary} />
      <path d="M78 32 L96 50 L85 66 L70 52 Z" fill={secondary} />
      {/* corpo maglia */}
      <path
        d="M30 28 C38 22 62 22 70 28 L76 54 L64 60 L64 110 L36 110 L36 60 L24 54 Z"
        fill={primary}
      />
      {/* colletto */}
      <path d="M41 26 L50 38 L59 26 C55 32 45 32 41 26 Z" fill={secondary} />
      {/* fascia centrale */}
      <rect x="47" y="40" width="6" height="70" fill={secondary} opacity="0.55" />
    </svg>
  );
}
