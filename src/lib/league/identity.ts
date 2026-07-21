// Logica PURA dell'identità squadra e dell'immagine del giocatore:
// risoluzione colori (sociali → default app), numero di maglia, priorità
// dell'immagine (foto giocatore > maglia squadra > maglia generata). Testabile.

import type { LeaguePlayer, TeamIdentity } from "./types";
import { pickIndex } from "@/lib/figurine/traits";

// Colori di default dell'app (verde scuro / oro del restyling).
export const APP_COLORS = { primary: "#123D28", secondary: "#D4AF37" } as const;

export const RARE_FM_THRESHOLD = 7;

export interface ResolvedColors {
  primary: string;
  secondary: string;
}

export function resolveTeamColors(identity?: TeamIdentity | null): ResolvedColors {
  if (identity && identity.color1) {
    return { primary: identity.color1, secondary: identity.color2 ?? identity.color1 };
  }
  return { primary: APP_COLORS.primary, secondary: APP_COLORS.secondary };
}

// Numero di maglia di default (1-99), deterministico dal nome.
export function defaultJerseyNumber(name: string): number {
  return pickIndex(name, "jersey-number", 99) + 1;
}

export function displayNumber(player: LeaguePlayer): number {
  const n = player.number;
  return n && n >= 1 && n <= 99 ? n : defaultJerseyNumber(player.name);
}

export type PlayerImageMode = "photo" | "jerseyFront" | "generated";

export interface ResolvedPlayerImage {
  mode: PlayerImageMode;
  src: string | null; // url per photo/jerseyFront; null per la maglia generata
  rare: boolean;
}

// Priorità: foto del giocatore (mostrata SENZA alterazioni) > maglia squadra
// (fronte) > maglia generata nei colori sociali.
export function resolvePlayerImage(player: LeaguePlayer): ResolvedPlayerImage {
  const rare = player.fm >= RARE_FM_THRESHOLD;
  if (player.imageUrl) return { mode: "photo", src: player.imageUrl, rare };
  const jersey = player.owner?.jerseyFrontUrl ?? null;
  if (jersey) return { mode: "jerseyFront", src: jersey, rare };
  return { mode: "generated", src: null, rare };
}

// Combinazioni di colori sociali predefinite.
export const COLOR_PRESETS: { name: string; color1: string; color2: string }[] = [
  { name: "Verde/Oro", color1: "#123D28", color2: "#D4AF37" },
  { name: "Nerazzurro", color1: "#12213F", color2: "#2E6DB4" },
  { name: "Rossonero", color1: "#C8102E", color2: "#1A1A1A" },
  { name: "Bianconero", color1: "#1A1A1A", color2: "#F2F2F2" },
  { name: "Giallorosso", color1: "#8E1F2F", color2: "#F0BC42" },
  { name: "Biancoceleste", color1: "#5FB0E5", color2: "#0B2C5B" },
  { name: "Rossoblù", color1: "#B4122A", color2: "#12305C" },
  { name: "Viola", color1: "#5B2A86", color2: "#EFE7F6" },
  { name: "Granata", color1: "#7B1E23", color2: "#EAD9B0" },
  { name: "Arancio", color1: "#E67E22", color2: "#1A1A1A" },
];

export function isValidHexColor(c: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(c);
}
