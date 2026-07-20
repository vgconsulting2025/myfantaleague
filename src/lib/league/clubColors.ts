// Mappa club di Serie A → colori sociali (per la fascia della figurina e la
// maglia dell'avatar). Colori originali/approssimati, non ufficiali.
// Lookup tollerante (case-insensitive, senza accenti) con fallback neutro,
// così anche i club di leghe importate hanno sempre una resa dignitosa.

export interface ClubColors {
  primary: string;
  secondary: string;
}

const DEFAULT_COLORS: ClubColors = { primary: "#2F855A", secondary: "#E2E8F0" };

const CLUBS: Record<string, ClubColors> = {
  inter: { primary: "#12213F", secondary: "#2E6DB4" },
  milan: { primary: "#C8102E", secondary: "#1A1A1A" },
  juventus: { primary: "#1A1A1A", secondary: "#FFFFFF" },
  napoli: { primary: "#12A0D7", secondary: "#0B3B66" },
  roma: { primary: "#8E1F2F", secondary: "#F0BC42" },
  lazio: { primary: "#5FB0E5", secondary: "#0B2C5B" },
  atalanta: { primary: "#1D2A44", secondary: "#2E6DB4" },
  fiorentina: { primary: "#5B2A86", secondary: "#EFE7F6" },
  bologna: { primary: "#9F1B32", secondary: "#1A2F5A" },
  torino: { primary: "#7B1E23", secondary: "#EAD9B0" },
  udinese: { primary: "#1A1A1A", secondary: "#D9D9D9" },
  lecce: { primary: "#E7C531", secondary: "#B4122A" },
  genoa: { primary: "#B4122A", secondary: "#12305C" },
  cagliari: { primary: "#9B1B2E", secondary: "#1C3F94" },
  empoli: { primary: "#1F6FB2", secondary: "#EAF2FA" },
  "hellas verona": { primary: "#F4C430", secondary: "#0B2C5B" },
  verona: { primary: "#F4C430", secondary: "#0B2C5B" },
  como: { primary: "#0B4DA2", secondary: "#EAF2FA" },
  parma: { primary: "#F4C430", secondary: "#1C6BB0" },
  monza: { primary: "#E30613", secondary: "#F2F2F2" },
  venezia: { primary: "#1A1A1A", secondary: "#E67E22" },
  sassuolo: { primary: "#00A651", secondary: "#0A0A0A" },
  salernitana: { primary: "#7A1F2B", secondary: "#EDE6D6" },
  frosinone: { primary: "#F4C430", secondary: "#0B4DA2" },
  palermo: { primary: "#E8A0BF", secondary: "#1A1A1A" },
  sampdoria: { primary: "#1C6BB0", secondary: "#C8102E" },
};

function normalizeClub(club: string): string {
  return club
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(/\s+/g, " ")
    .trim();
}

export function getClubColors(club: string | undefined | null): ClubColors {
  if (!club) return DEFAULT_COLORS;
  const key = normalizeClub(club);
  if (CLUBS[key]) return CLUBS[key];
  // match parziale (es. "ac milan" → "milan")
  for (const name of Object.keys(CLUBS)) {
    if (key.includes(name)) return CLUBS[name];
  }
  return DEFAULT_COLORS;
}
