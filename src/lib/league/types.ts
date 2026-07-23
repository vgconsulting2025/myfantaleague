// Tipi di dominio della lega, indipendenti dal layer di persistenza (Prisma).
// UI e API route lavorano SOLO con questi tipi: cambiando l'implementazione del
// repository (seed → import CSV / Leghe Fantacalcio) il resto dell'app non cambia.

export type Role = "P" | "D" | "C" | "A";

// Identità della fanta-squadra (stemma, maglia, colori sociali).
export interface TeamIdentity {
  name: string;
  crestUrl: string | null;
  jerseyFrontUrl: string | null;
  jerseyBackUrl: string | null;
  color1: string | null;
  color2: string | null;
}

// Progressi del giocatore idolo, tracciati giornata per giornata mentre resta
// idolo. Base per futuri livelli/skin.
export interface IdolProgress {
  cumFm: number; // fantamedia cumulata giornata per giornata
  bestCount: number; // giornate da migliore in campo della squadra
  streak: number; // giornate consecutive da idolo senza cambio
  setGiornata: number | null; // giornata dell'ultima designazione
  level: number; // livello progressione (1 Bronzo .. 4 Leggenda)
  quote: string | null; // citazione "da tifoso" (solo Leggenda)
}

export interface LeaguePlayer {
  id: string;
  name: string;
  role: Role;
  club: string;
  quota: number;
  fm: number;
  imageUrl?: string | null;
  number?: number | null;
  owner?: TeamIdentity; // identità della squadra proprietaria (per figurina)
  isIdol?: boolean; // true se è l'idolo designato della propria squadra
  idolProgress?: IdolProgress | null; // valorizzato solo sul giocatore idolo
}

// Storico degli scontri diretti (derby) contro il rivale corrente.
export interface RivalRecord {
  wins: number;
  draws: number;
  losses: number;
  pointsFor: number; // punteggio totale della propria squadra nei derby
  pointsAgainst: number; // punteggio totale del rivale nei derby
  derbies: number; // numero di derby giocati
  setGiornata: number | null; // giornata dell'ultima scelta del rivale
}

export interface LeagueTeam {
  id: string;
  slug: string;
  name: string;
  president: string;
  points: number;
  isUser: boolean;
  players: LeaguePlayer[];
  crestUrl?: string | null;
  jerseyFrontUrl?: string | null;
  jerseyBackUrl?: string | null;
  color1?: string | null;
  color2?: string | null;
  idolPlayerId?: string | null; // id del giocatore idolo (null = nessuno)
  idolSetGiornata?: number | null; // giornata dell'ultima designazione (vincolo cambio)
  rivalTeamId?: string | null; // id della squadra rivale (null = nessuno)
  rivalSetGiornata?: number | null; // giornata dell'ultima scelta (vincolo cambio)
  rivalRecord?: RivalRecord | null; // storico derby vs rivale corrente
}

export interface PlayerPerformance {
  playerName: string;
  role: Role;
  vote: number;
  bonus: number;
  fielded: boolean;
}

export interface CoachRatingItem {
  id: string;
  giornata: number;
  teamName: string;
  president: string;
  score: number;
  comment: string;
  createdAt: string;
}

export interface PeerVoteItem {
  id: string;
  giornata: number;
  fromTeam: string;
  toTeam: string;
  fromLabel: string;
  score: number;
  comment: string;
  hidden: boolean;
  createdAt: string;
}

export interface PresidentStanding {
  teamName: string;
  president: string;
  label: string;
  isUser: boolean;
  aiAvg: number | null;
  aiCount: number;
  peerAvg: number | null;
  peerCount: number;
  overall: number | null;
  badges: string[];
}

export interface PlayerWithTeam {
  player: LeaguePlayer;
  teamName: string;
  teamSlug: string;
  isUser: boolean;
  owner: TeamIdentity;
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
  createdAt?: string;
}

export interface LeagueConfig {
  gazzettaName: string;
  freeAgentEnabled: boolean;
  freeAgentMaxPerWeek: number;
}

export type FreeAgentStatus = "pending" | "accepted" | "rejected";

export interface FreeAgentProposalItem {
  id: string;
  createdAt: string;
  status: FreeAgentStatus;
  teamName: string;
  giveName: string;
  giveRole: Role;
  giveQuota: number;
  giveFm: number;
  faName: string;
  faRole: Role;
  faClub: string;
  faQuota: number;
  faFm: number;
  rationale: string;
  agentComment: string;
  forUser: boolean;
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
