// Logo/simbolo dell'app: scudo geometrico con monogramma "MF" (verde scuro/oro).
// Originale, scalabile; usato in header, come favicon e come stemma di fallback.
export default function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="MyFantaLeague"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Scudo */}
      <path
        d="M32 3 L57 12 V32 C57 47 46 57 32 61 C18 57 7 47 7 32 V12 Z"
        fill="#123D28"
        stroke="#D4AF37"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Accenno di campo */}
      <path d="M8 34 H56" stroke="#D4AF37" strokeWidth="1.4" opacity="0.35" />
      <circle cx="32" cy="34" r="6.5" fill="none" stroke="#D4AF37" strokeWidth="1.4" opacity="0.35" />
      {/* Monogramma MF (tratti, indipendente dal font) */}
      <g fill="none" stroke="#D4AF37" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 42 V22 L25 33 L32 22 V42" />
        <path d="M37 22 H47 M37 22 V42 M37 32 H45" />
      </g>
    </svg>
  );
}
