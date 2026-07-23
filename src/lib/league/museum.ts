// Logica PURA del "Museo della lega": costruzione dei traguardi storici e
// rilevamento dei record di giornata. Indipendente dal DB, testabile.

import type { MuseumEntryInput } from "./types";

export interface MatchLite {
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
}

export interface RatingLite {
  president: string;
  teamName: string;
  score: number;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// Miglior punteggio di squadra della giornata + squadra che l'ha realizzato.
export function bestTeamScore(results: MatchLite[]): { team: string; score: number } | null {
  let best: { team: string; score: number } | null = null;
  for (const r of results) {
    if (!best || r.homeScore > best.score) best = { team: r.home, score: r.homeScore };
    if (!best || r.awayScore > best.score) best = { team: r.away, score: r.awayScore };
  }
  return best;
}

// Scarto più ampio della giornata (vincitore, perdente, margine, punteggio).
export function biggestMargin(
  results: MatchLite[],
): { winner: string; loser: string; margin: number; score: string } | null {
  let best: { winner: string; loser: string; margin: number; score: string } | null = null;
  for (const r of results) {
    const margin = Math.abs(r.homeScore - r.awayScore);
    if (margin <= 0) continue;
    if (!best || margin > best.margin) {
      const winner = r.homeScore >= r.awayScore ? r.home : r.away;
      const loser = r.homeScore >= r.awayScore ? r.away : r.home;
      const hi = Math.max(r.homeScore, r.awayScore);
      const lo = Math.min(r.homeScore, r.awayScore);
      best = { winner, loser, margin: round1(margin), score: `${hi.toFixed(1)} - ${lo.toFixed(1)}` };
    }
  }
  return best;
}

// Un idolo raggiunge la Leggenda.
export function legendEntry(playerName: string, teamName: string, giornata: number): MuseumEntryInput {
  return {
    type: "leggenda",
    title: `${playerName} è Leggenda`,
    subtitle: teamName,
    detail: "Idolo salito al livello Leggenda",
    giornata,
  };
}

export const PANCHINA_THRESHOLD = 8;

// Panchina d'oro: miglior allenatore della giornata, se sopra soglia.
export function panchinaEntry(
  ratings: RatingLite[],
  giornata: number,
  threshold: number = PANCHINA_THRESHOLD,
): MuseumEntryInput | null {
  if (!ratings.length) return null;
  const best = ratings.reduce((a, b) => (b.score > a.score ? b : a));
  if (best.score < threshold) return null;
  const label = best.president && best.president !== "—" ? best.president : best.teamName;
  return {
    type: "panchina",
    title: `Panchina d'oro: ${label}`,
    subtitle: best.teamName,
    detail: `Miglior allenatore della giornata (${best.score}/10)`,
    giornata,
    value: best.score,
  };
}

// Record di punteggio: superato solo se batte il record corrente.
export function recordScoreEntry(
  results: MatchLite[],
  giornata: number,
  currentRecord: number | null,
): MuseumEntryInput | null {
  const b = bestTeamScore(results);
  if (!b) return null;
  if (currentRecord != null && b.score <= currentRecord) return null;
  return {
    type: "record_score",
    title: `Record di punteggio: ${b.score.toFixed(1)}`,
    subtitle: b.team,
    detail: "Punteggio di squadra più alto di sempre",
    giornata,
    value: round1(b.score),
  };
}

// Record di scarto: superato solo se batte il record corrente.
export function recordMarginEntry(
  results: MatchLite[],
  giornata: number,
  currentRecord: number | null,
): MuseumEntryInput | null {
  const m = biggestMargin(results);
  if (!m) return null;
  if (currentRecord != null && m.margin <= currentRecord) return null;
  return {
    type: "record_margin",
    title: `Record di scarto: ${m.margin.toFixed(1)}`,
    subtitle: `${m.winner} vs ${m.loser}`,
    detail: `Vittoria più larga di sempre (${m.score})`,
    giornata,
    value: m.margin,
  };
}

export const DERBY_MARGIN_THRESHOLD = 10;

// Derby memorabile: solo se lo scarto supera la soglia.
export function derbyEntry(
  userTeam: string,
  rivalTeam: string,
  userScore: number,
  rivalScore: number,
  giornata: number,
  threshold: number = DERBY_MARGIN_THRESHOLD,
): MuseumEntryInput | null {
  const margin = Math.abs(userScore - rivalScore);
  if (margin < threshold) return null;
  const winner = userScore >= rivalScore ? userTeam : rivalTeam;
  const loser = userScore >= rivalScore ? rivalTeam : userTeam;
  return {
    type: "derby",
    title: `Derby da ricordare: ${winner} travolge ${loser}`,
    subtitle: `${userTeam} vs ${rivalTeam}`,
    detail: `${userTeam} ${userScore.toFixed(1)} - ${rivalScore.toFixed(1)} ${rivalTeam}`,
    giornata,
    value: round1(margin),
  };
}

// Scambio storico (accettato).
export function tradeEntry(
  fromTeam: string,
  toTeam: string,
  give: string,
  receive: string,
): MuseumEntryInput {
  return {
    type: "trade",
    title: `Scambio storico: ${give} ↔ ${receive}`,
    subtitle: `${fromTeam} ⇄ ${toTeam}`,
    detail: `${fromTeam} cede ${give} e riceve ${receive} da ${toTeam}`,
  };
}
