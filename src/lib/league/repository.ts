// Interfaccia astratta di accesso ai dati della lega + factory.
//
// Tutto il resto dell'app (pagine, API route) dipende SOLO da questa interfaccia.
// Oggi la implementazione è su Prisma/SQLite con una lega demo (seed); in futuro
// si potrà aggiungere un import da CSV o dalle piattaforme reali (Leghe
// Fantacalcio / Fantacalcio.it) creando una nuova classe che implementa
// LeagueRepository, senza toccare UI o route.

import type {
  Article,
  ArticleInput,
  CoachRatingItem,
  Edition,
  FlashItem,
  FreeAgentProposalItem,
  Giornata,
  LeagueConfig,
  LeaguePlayer,
  LeagueTeam,
  MatchResult,
  MuseumEntryInput,
  MuseumItem,
  MuseumType,
  PeerVoteItem,
  PlayerWithTeam,
  PresidentStanding,
  Role,
  TradeRecord,
  TradeStatus,
} from "./types";
import type { ImportResultRow } from "./import/types";
import type { RivalCounters } from "./rival";

export interface FreeAgentInput {
  name: string;
  role: Role;
  club: string;
  quota: number;
  fm: number;
}

export interface NewFreeAgentProposal {
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
  status?: "pending" | "accepted" | "rejected";
}

export interface PerformanceInput {
  teamName: string;
  president: string;
  playerName: string;
  role: Role;
  vote: number;
  bonus: number;
  fielded: boolean;
}

// Salita di livello dell'idolo, restituita da advanceIdolTracking.
export interface IdolLevelUp {
  teamName: string;
  playerName: string;
  fromLevel: number;
  toLevel: number;
}

// Derby col rivale storico giocato in una giornata, restituito da
// advanceRivalTracking. `record` è lo storico GIÀ aggiornato con questo derby.
export interface DerbyEvent {
  userTeamName: string;
  rivalTeamName: string;
  userScore: number;
  rivalScore: number;
  record: RivalCounters;
}

export interface CoachRatingInput {
  teamName: string;
  president: string;
  score: number;
  comment: string;
}

export interface PeerVoteInput {
  fromTeam: string;
  toTeam: string;
  score: number;
  comment: string;
}

export type TeamImageKind = "crest" | "jerseyFront" | "jerseyBack";

export interface NewTrade {
  status: TradeStatus;
  fromTeam: string;
  toTeam: string;
  giveName: string;
  receiveName: string;
  rationale: string;
  agentComment: string;
}

// Squadra importata (rosa) usata da replaceLeague / mergeRoster.
export interface ImportTeamData {
  name: string;
  players: { name: string; role: Role; club: string; quota: number; fm: number }[];
}

export interface LeagueRepository {
  // Lettura
  getTeams(): Promise<LeagueTeam[]>;
  getUserTeam(): Promise<LeagueTeam>;
  getStandings(): Promise<LeagueTeam[]>;
  getLatestGiornata(): Promise<Giornata | null>;
  getEditions(): Promise<Edition[]>;
  getLatestEdition(): Promise<Edition | null>;
  getTrades(): Promise<TradeRecord[]>;
  getFlashNews(limit?: number): Promise<FlashItem[]>;
  getPlayerById(id: string): Promise<PlayerWithTeam | null>;
  setPlayerImage(playerId: string, imageUrl: string | null): Promise<void>;
  setPlayerNumber(playerId: string, number: number | null): Promise<void>;
  setUserTeamImage(kind: TeamImageKind, url: string | null): Promise<void>;
  setUserTeamColors(color1: string | null, color2: string | null): Promise<void>;
  getPerformances(giornataNumber: number): Promise<PerformanceInput[]>;
  getCoachRatings(limit?: number): Promise<CoachRatingItem[]>;
  getCoachRatingsForGiornata(giornataNumber: number): Promise<CoachRatingItem[]>;
  getPeerVotes(): Promise<PeerVoteItem[]>;
  getPresidentStandings(): Promise<PresidentStanding[]>;

  // Scrittura
  saveEdition(articles: ArticleInput[], giornata: number | null): Promise<Edition>;
  recordTrade(trade: NewTrade): Promise<TradeRecord>;
  executeTradeSwap(
    userTeamName: string,
    otherTeamName: string,
    giveName: string,
    receiveName: string,
  ): Promise<void>;
  pushFlashNews(text: string, kind?: string): Promise<FlashItem>;
  recordGiornata(
    results: MatchResult[],
    pointsByTeamName: Record<string, number>,
    performances?: PerformanceInput[],
  ): Promise<Giornata>;
  // Configurazione lega
  getConfig(): Promise<LeagueConfig>;
  updateConfig(patch: Partial<LeagueConfig>): Promise<LeagueConfig>;

  // Svincolati
  getFreeAgents(): Promise<LeaguePlayer[]>;
  addFreeAgent(input: FreeAgentInput): Promise<void>;
  addFreeAgentsBulk(inputs: FreeAgentInput[]): Promise<void>;
  updateFreeAgent(id: string, patch: Partial<FreeAgentInput>): Promise<void>;
  removeFreeAgent(id: string): Promise<void>;

  // Notizie singole (non parte di un'edizione)
  addNewsArticle(article: ArticleInput): Promise<void>;
  getRecentNews(limit?: number): Promise<Article[]>;

  // Proposte svincolati
  createFreeAgentProposals(proposals: NewFreeAgentProposal[]): Promise<void>;
  getFreeAgentProposals(): Promise<FreeAgentProposalItem[]>;
  getPendingFreeAgentProposals(forUserOnly: boolean): Promise<FreeAgentProposalItem[]>;
  getFreeAgentProposal(id: string): Promise<FreeAgentProposalItem | null>;
  setFreeAgentProposalStatus(id: string, status: "accepted" | "rejected"): Promise<void>;
  executeFreeAgentSwap(teamName: string, giveName: string, faName: string): Promise<void>;

  // Museo della lega
  addMuseumEntry(entry: MuseumEntryInput): Promise<void>;
  getMuseumEntries(limit?: number): Promise<MuseumItem[]>;
  getMuseumTopValue(type: MuseumType): Promise<number | null>;

  // Rivale storico
  setRival(teamId: string, giornata: number): Promise<void>;
  // Rileva i derby utente-rivale nella giornata, aggiorna lo storico e li ritorna.
  advanceRivalTracking(results: MatchResult[]): Promise<DerbyEvent[]>;

  // Giocatore idolo
  setIdol(playerId: string, giornata: number): Promise<void>;
  // Aggiorna contatori e livello di ogni idolo; ritorna le salite di livello.
  advanceIdolTracking(performances: PerformanceInput[]): Promise<IdolLevelUp[]>;
  setIdolQuote(teamName: string, quote: string): Promise<void>;

  saveCoachRatings(giornataNumber: number, ratings: CoachRatingInput[]): Promise<void>;
  savePeerVotes(giornataNumber: number, votes: PeerVoteInput[]): Promise<void>;
  addPeerVote(
    fromTeam: string,
    toTeam: string,
    score: number,
    comment: string,
  ): Promise<{ ok: boolean; error?: string }>;
  hidePeerVote(id: string): Promise<void>;

  // Import lega
  replaceLeague(teams: ImportTeamData[], myTeamName: string | null): Promise<void>;
  mergeRoster(teams: ImportTeamData[], myTeamName: string | null): Promise<void>;
  importResults(results: ImportResultRow[]): Promise<void>;
  resetToDemo(): Promise<void>;
}

import { PrismaLeagueRepository } from "./prisma-repository";

let instance: LeagueRepository | null = null;

/** Restituisce l'implementazione corrente del repository (singleton). */
export function getLeagueRepository(): LeagueRepository {
  if (!instance) instance = new PrismaLeagueRepository();
  return instance;
}
