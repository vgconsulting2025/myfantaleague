import { describe, it, expect } from "vitest";
import {
  bestTeamScore,
  biggestMargin,
  legendEntry,
  panchinaEntry,
  recordScoreEntry,
  recordMarginEntry,
  derbyEntry,
  tradeEntry,
  type MatchLite,
} from "./museum";

const results: MatchLite[] = [
  { home: "A", away: "B", homeScore: 72, awayScore: 60 },
  { home: "C", away: "D", homeScore: 55, awayScore: 88 },
  { home: "E", away: "F", homeScore: 66, awayScore: 66 },
];

describe("bestTeamScore / biggestMargin", () => {
  it("trova il punteggio di squadra più alto", () => {
    expect(bestTeamScore(results)).toEqual({ team: "D", score: 88 });
  });
  it("trova lo scarto più ampio con vincitore e perdente", () => {
    const m = biggestMargin(results);
    expect(m).toMatchObject({ winner: "D", loser: "C", margin: 33 });
  });
});

describe("recordScoreEntry (record di punteggio)", () => {
  it("registra il record quando non ce n'è ancora", () => {
    const e = recordScoreEntry(results, 3, null);
    expect(e).not.toBeNull();
    expect(e!.type).toBe("record_score");
    expect(e!.value).toBe(88);
    expect(e!.subtitle).toBe("D");
  });
  it("registra solo se batte il record corrente", () => {
    expect(recordScoreEntry(results, 3, 90)).toBeNull(); // 88 <= 90
    expect(recordScoreEntry(results, 3, 80)).not.toBeNull(); // 88 > 80
  });
});

describe("recordMarginEntry (record di scarto)", () => {
  it("registra solo se batte il record corrente", () => {
    expect(recordMarginEntry(results, 3, null)!.value).toBe(33);
    expect(recordMarginEntry(results, 3, 40)).toBeNull();
    expect(recordMarginEntry(results, 3, 20)).not.toBeNull();
  });
});

describe("panchinaEntry (soglia)", () => {
  const ratings = [
    { president: "Tu", teamName: "Real Divano", score: 8.5 },
    { president: "Luca", teamName: "Atletico", score: 6 },
  ];
  it("registra il miglior allenatore se sopra soglia", () => {
    const e = panchinaEntry(ratings, 4);
    expect(e).not.toBeNull();
    expect(e!.type).toBe("panchina");
    expect(e!.title).toContain("Tu");
  });
  it("nessuna panchina se sotto soglia", () => {
    expect(panchinaEntry([{ president: "X", teamName: "Y", score: 7 }], 4)).toBeNull();
  });
});

describe("derbyEntry (soglia scarto)", () => {
  it("registra il derby memorabile solo con scarto ampio", () => {
    expect(derbyEntry("A", "B", 80, 60, 5)).not.toBeNull(); // scarto 20
    expect(derbyEntry("A", "B", 70, 66, 5)).toBeNull(); // scarto 4
  });
});

describe("legendEntry / tradeEntry", () => {
  it("leggenda: tipo e squadra corretti", () => {
    const e = legendEntry("Lautaro", "Real Divano", 12);
    expect(e.type).toBe("leggenda");
    expect(e.title).toContain("Lautaro");
    expect(e.subtitle).toBe("Real Divano");
  });
  it("scambio: cita i due giocatori e le squadre", () => {
    const e = tradeEntry("Real Divano", "AC Sciacallo", "Bremer", "Di Lorenzo");
    expect(e.type).toBe("trade");
    expect(`${e.title} ${e.subtitle} ${e.detail}`).toContain("Bremer");
    expect(`${e.title} ${e.subtitle} ${e.detail}`).toContain("Di Lorenzo");
  });
});
