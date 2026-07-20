// Tipi per l'import dei dati della lega (rose + calendario).
import type { Role } from "../types";

export type ImportKind = "roster" | "calendar";
export type ImportMode = "replace" | "merge";

// Una riga di rosa riconosciuta (role "?" = da correggere in anteprima).
export interface ImportPlayerRow {
  team: string;
  name: string;
  role: Role | "?";
  club: string;
  quota: number;
  fm: number;
}

// Una partita/risultato di giornata riconosciuta.
export interface ImportResultRow {
  giornata: number;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  note: string;
}

export interface RosterPreview {
  kind: "roster";
  players: ImportPlayerRow[];
  teams: string[];
  warnings: string[];
  mapping: Record<string, string>; // campo → intestazione rilevata
}

export interface CalendarPreview {
  kind: "calendar";
  results: ImportResultRow[];
  warnings: string[];
  mapping: Record<string, string>;
}

export type ImportPreview = RosterPreview | CalendarPreview;
