// Tipi di dominio della lega, indipendenti dal layer di persistenza (Prisma).
// UI e API route lavorano SOLO con questi tipi: cambiando l'implementazione del
// repository (seed → import CSV / Leghe Fantacalcio) il resto dell'app non cambia.

export type Role = "P" | "D" | "C" | "A";

export interface LeaguePlayer {
  id: string;
  name: string;
  role: Role;
  club: string;
  quota: number;
  fm: number;
}

export interface LeagueTeam {
  id: string;
  slug: string;
  name: string;
  president: string;
  points: number;
  isUser: boolean;
  players: LeaguePlayer[];
}

export interface MatchResult {
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  note: string;
}

export interface Giornata {
  number: number;
  playedAt: string;
  results: MatchResult[];
}

export interface ArticleInput {
  kicker: string;
  title: string;
  body: string;
  category: string;
}

export interface Article extends ArticleInput {
  id: string;
  isLead: boolean;
  order: number;
}

export interface Edition {
  id: string;
  createdAt: string;
  giornata: number | null;
  articles: Article[];
}

export type TradeStatus = "accepted" | "rejected";

export interface TradeRecord {
  id: string;
  createdAt: string;
  status: TradeStatus;
  fromTeam: string;
  toTeam: string;
  giveName: string;
  receiveName: string;
  rationale: string;
  agentComment: string;
}

export interface FlashItem {
  id: string;
  createdAt: string;
  text: string;
  kind: string;
}

// Proposta grezza restituita dall'AgentE (prima della validazione).
export interface TradeProposal {
  otherTeam: string;
  give: string;
  receive: string;
  rationale: string;
  agentComment: string;
}

// Proposta validata + arricchita coi dati dei due giocatori (per l'UI).
export interface EnrichedProposal extends TradeProposal {
  id: number;
  status: "pending" | "accepted" | "rejected";
  givePlayer: LeaguePlayer | null;
  receivePlayer: LeaguePlayer | null;
}
