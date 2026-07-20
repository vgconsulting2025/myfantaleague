// Interfaccia astratta di accesso ai dati della lega + factory.
//
// Tutto il resto dell'app (pagine, API route) dipende SOLO da questa interfaccia.
// Oggi la implementazione è su Prisma/SQLite con una lega demo (seed); in futuro
// si potrà aggiungere un import da CSV o dalle piattaforme reali (Leghe
// Fantacalcio / Fantacalcio.it) creando una nuova classe che implementa
// LeagueRepository, senza toccare UI o route.

import type {
  ArticleInput,
  Edition,
  FlashItem,
  Giornata,
  LeagueTeam,
  MatchResult,
  Role,
  TradeRecord,
  TradeStatus,
} from "./types";
import type { ImportResultRow } from "./import/types";

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
  ): Promise<Giornata>;

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
