// Logica PURA dei "Voti agli allenatori": valutazione delle scelte di formazione,
// validazione dei voti tra presidenti, calcolo delle medie e dei badge.
// Nessun accesso a DB/rete → testabile.

import type { PlayerPerformance, PresidentStanding } from "./types";

export const GEM_THRESHOLD = 7; // fantavoto di un panchinaro "che avrebbe fatto bonus"
export const FLOP_THRESHOLD = 5; // fantavoto da bocciatura di un titolare
export const PEER_COMMENT_MAX = 140;

export const BADGE_BEST = "Allenatore del mese";
export const BADGE_WORST = "Panchina d'oro";

function fanta(p: PlayerPerformance): number {
  return p.vote + p.bonus;
}

function mean(a: number[]): number {
  return a.reduce((s, x) => s + x, 0) / a.length;
}

export interface CoachEval {
  score: number; // 1-10
  teamTotal: number;
  benchedGems: PlayerPerformance[]; // panchinari che hanno fatto bonus/alto
  startedFlops: PlayerPerformance[]; // titolari flop
  best: PlayerPerformance | null; // miglior fantavoto della rosa
  worst: PlayerPerformance | null; // peggior titolare
}

// Valuta le scelte dell'allenatore: penalizza i gioielli lasciati in panchina e
// i titolari flop, premia se il migliore era in campo e se la formazione ha reso.
export function evaluateCoach(perfs: PlayerPerformance[]): CoachEval {
  const fielded = perfs.filter((p) => p.fielded);
  const bench = perfs.filter((p) => !p.fielded);

  const benchedGems = bench
    .filter((p) => fanta(p) >= GEM_THRESHOLD)
    .sort((a, b) => fanta(b) - fanta(a));
  const startedFlops = fielded
    .filter((p) => fanta(p) <= FLOP_THRESHOLD)
    .sort((a, b) => fanta(a) - fanta(b));

  const teamTotal = fielded.reduce((s, p) => s + fanta(p), 0);
  const best = perfs.length ? [...perfs].sort((a, b) => fanta(b) - fanta(a))[0] : null;
  const worst = fielded.length ? [...fielded].sort((a, b) => fanta(a) - fanta(b))[0] : null;

  let score = 6.5;
  score -= benchedGems.length * 1.3;
  score -= startedFlops.length * 0.7;
  if (best && best.fielded) score += 0.8;
  if (fielded.length) score += (mean(fielded.map(fanta)) - 6) * 0.6;

  return {
    score: Math.max(1, Math.min(10, Math.round(score))),
    teamTotal,
    benchedGems,
    startedFlops,
    best,
    worst,
  };
}

export interface PeerVoteValidation {
  ok: boolean;
  error?: string;
}

// Un presidente non può votare la propria squadra; voto intero 1-10; commento limitato.
export function validatePeerVote(
  fromTeam: string,
  toTeam: string,
  score: number,
  comment = "",
): PeerVoteValidation {
  if (!fromTeam || !toTeam) return { ok: false, error: "Squadra mancante." };
  if (fromTeam === toTeam) return { ok: false, error: "Non puoi votare la tua stessa squadra." };
  if (!Number.isInteger(score) || score < 1 || score > 10) {
    return { ok: false, error: "Il voto deve essere un intero tra 1 e 10." };
  }
  if (comment.length > PEER_COMMENT_MAX) {
    return { ok: false, error: `Commento troppo lungo (max ${PEER_COMMENT_MAX} caratteri).` };
  }
  return { ok: true };
}

export function labelFor(teamName: string, president: string): string {
  return president && president !== "—" ? president : teamName;
}

export interface PresidentInput {
  teamName: string;
  president: string;
  isUser: boolean;
}

// Calcola medie (voti AI nel tempo + voti dei presidenti) e assegna i badge.
export function computePresidentStandings(
  teams: PresidentInput[],
  aiRatings: { teamName: string; score: number }[],
  peerVotes: { toTeam: string; score: number; hidden: boolean }[],
): PresidentStanding[] {
  const standings: PresidentStanding[] = teams.map((t) => {
    const ai = aiRatings.filter((r) => r.teamName === t.teamName).map((r) => r.score);
    const peer = peerVotes
      .filter((v) => !v.hidden && v.toTeam === t.teamName)
      .map((v) => v.score);
    const aiAvg = ai.length ? mean(ai) : null;
    const peerAvg = peer.length ? mean(peer) : null;
    const present = [aiAvg, peerAvg].filter((x): x is number => x !== null);
    const overall = present.length ? mean(present) : null;
    return {
      teamName: t.teamName,
      president: t.president,
      label: labelFor(t.teamName, t.president),
      isUser: t.isUser,
      aiAvg,
      aiCount: ai.length,
      peerAvg,
      peerCount: peer.length,
      overall,
      badges: [],
    };
  });

  standings.sort((a, b) => (b.overall ?? -1) - (a.overall ?? -1));

  const rated = standings.filter((s) => s.overall !== null);
  if (rated.length >= 1) rated[0].badges.push(BADGE_BEST);
  if (rated.length >= 2) rated[rated.length - 1].badges.push(BADGE_WORST);

  return standings;
}
