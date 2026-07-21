import { describe, it, expect } from "vitest";
import {
  evaluateCoach,
  validatePeerVote,
  computePresidentStandings,
  BADGE_BEST,
  BADGE_WORST,
  PEER_COMMENT_MAX,
} from "./coach";
import type { PlayerPerformance, Role } from "./types";

function perf(
  playerName: string,
  vote: number,
  bonus: number,
  fielded: boolean,
  role: Role = "C",
): PlayerPerformance {
  return { playerName, role, vote, bonus, fielded };
}

describe("evaluateCoach", () => {
  it("premia una formazione azzeccata (miglior giocatore in campo, nessun errore)", () => {
    const perfs = [
      perf("A", 7, 1, true),
      perf("B", 6.5, 0, true),
      perf("C", 6.5, 0, true),
      perf("D", 5.5, 0, false), // panchinaro basso: nessun rimpianto
    ];
    expect(evaluateCoach(perfs).score).toBeGreaterThanOrEqual(7);
  });

  it("penalizza gioielli in panchina e titolari flop", () => {
    const clean = [perf("A", 6.5, 0, true), perf("B", 6.5, 0, true), perf("C", 5.5, 0, false)];
    const bad = [
      perf("A", 4, 0, true), // titolare flop
      perf("B", 6, 0, true),
      perf("Gem", 7.5, 1, false), // panchinaro che avrebbe fatto bonus
    ];
    const evBad = evaluateCoach(bad);
    expect(evBad.benchedGems.map((p) => p.playerName)).toContain("Gem");
    expect(evBad.startedFlops.map((p) => p.playerName)).toContain("A");
    expect(evBad.score).toBeLessThan(evaluateCoach(clean).score);
  });

  it("mantiene il voto nell'intervallo 1-10", () => {
    const disaster = [
      perf("F1", 3, 0, true),
      perf("F2", 3, 0, true),
      perf("G1", 9, 3, false),
      perf("G2", 8, 3, false),
      perf("G3", 8, 1, false),
    ];
    const ev = evaluateCoach(disaster);
    expect(ev.score).toBeGreaterThanOrEqual(1);
    expect(ev.score).toBeLessThanOrEqual(10);
  });
});

describe("validatePeerVote", () => {
  it("impedisce di votare la propria squadra", () => {
    expect(validatePeerVote("Real Divano", "Real Divano", 8).ok).toBe(false);
  });
  it("accetta un voto valido verso un'altra squadra", () => {
    expect(validatePeerVote("Real Divano", "AC Sciacallo", 7).ok).toBe(true);
  });
  it("rifiuta voti fuori range o non interi", () => {
    expect(validatePeerVote("A", "B", 0).ok).toBe(false);
    expect(validatePeerVote("A", "B", 11).ok).toBe(false);
    expect(validatePeerVote("A", "B", 6.5).ok).toBe(false);
  });
  it("rifiuta commenti troppo lunghi", () => {
    expect(validatePeerVote("A", "B", 6, "x".repeat(PEER_COMMENT_MAX + 1)).ok).toBe(false);
  });
});

describe("computePresidentStandings", () => {
  const teams = [
    { teamName: "Real Divano", president: "Tu", isUser: true },
    { teamName: "AC Sciacallo", president: "Marco", isUser: false },
    { teamName: "Sportiva Polleria", president: "Giulia", isUser: false },
  ];

  it("calcola medie AI e peer (esclusi i nascosti) e assegna i badge", () => {
    const ai = [
      { teamName: "Real Divano", score: 8 },
      { teamName: "Real Divano", score: 6 },
      { teamName: "AC Sciacallo", score: 4 },
    ];
    const peer = [
      { toTeam: "Real Divano", score: 9, hidden: false },
      { toTeam: "Real Divano", score: 3, hidden: true }, // escluso
      { toTeam: "AC Sciacallo", score: 5, hidden: false },
    ];
    const st = computePresidentStandings(teams, ai, peer);
    const byTeam = Object.fromEntries(st.map((s) => [s.teamName, s]));

    expect(byTeam["Real Divano"].aiAvg).toBe(7);
    expect(byTeam["Real Divano"].peerAvg).toBe(9); // il voto nascosto non conta
    expect(byTeam["Real Divano"].overall).toBe(8);
    expect(byTeam["AC Sciacallo"].overall).toBe(4.5);
    expect(byTeam["Sportiva Polleria"].overall).toBeNull();

    // ordinamento per media complessiva desc, non valutati in fondo
    expect(st[0].teamName).toBe("Real Divano");
    expect(st[st.length - 1].teamName).toBe("Sportiva Polleria");

    // badge al migliore e al peggiore (tra i valutati)
    expect(byTeam["Real Divano"].badges).toContain(BADGE_BEST);
    expect(byTeam["AC Sciacallo"].badges).toContain(BADGE_WORST);
    expect(byTeam["Sportiva Polleria"].badges).toHaveLength(0);
  });
});
