import { describe, it, expect } from "vitest";
import {
  canChangeIdol,
  isBestInField,
  nextIdolCounters,
  fantavoto,
  idolLevel,
  idolLevelInfo,
  type IdolPerf,
} from "./idol";

const perf = (playerName: string, vote: number, bonus: number, fielded = true): IdolPerf => ({
  playerName,
  vote,
  bonus,
  fielded,
});

describe("canChangeIdol (vincolo 1 cambio per giornata)", () => {
  it("la prima designazione è sempre consentita", () => {
    expect(canChangeIdol(null, null, 5)).toBe(true);
  });
  it("non permette un secondo cambio nella stessa giornata", () => {
    // idolo designato alla giornata 5, giornata corrente ancora 5 → bloccato
    expect(canChangeIdol("p1", 5, 5)).toBe(false);
  });
  it("permette il cambio dopo che è passata una nuova giornata", () => {
    expect(canChangeIdol("p1", 5, 6)).toBe(true);
  });
});

describe("isBestInField (migliore in campo della squadra)", () => {
  const team = [
    perf("Idolo", 7, 3), // fv 10
    perf("Altro", 6, 1), // fv 7
    perf("Panca", 9, 0, false), // in panchina, ignorato
  ];
  it("è migliore se titolare col fantavoto più alto", () => {
    expect(isBestInField(team, "Idolo")).toBe(true);
  });
  it("non è migliore se ha un fantavoto inferiore a un titolare", () => {
    expect(isBestInField(team, "Altro")).toBe(false);
  });
  it("non è migliore se è rimasto in panchina", () => {
    expect(isBestInField([perf("Idolo", 8, 2, false), perf("Altro", 5, 0)], "Idolo")).toBe(false);
  });
  it("a parità di fantavoto conta come migliore", () => {
    expect(isBestInField([perf("Idolo", 7, 0), perf("Altro", 7, 0)], "Idolo")).toBe(true);
  });
});

describe("nextIdolCounters (avanzamento a fine giornata)", () => {
  const start = { cumFm: 0, bestCount: 0, streak: 0 };
  it("accumula fantavoto, +1 migliore in campo e +1 fedeltà", () => {
    const team = [perf("Idolo", 7, 3), perf("Altro", 6, 0)];
    const r = nextIdolCounters(start, team, "Idolo");
    expect(r.cumFm).toBe(fantavoto(team[0])); // 10
    expect(r.bestCount).toBe(1);
    expect(r.streak).toBe(1);
  });
  it("non incrementa 'migliore' se non è il top, ma accumula e resta fedele", () => {
    const team = [perf("Idolo", 5, 0), perf("Altro", 8, 0)];
    const r = nextIdolCounters({ cumFm: 4, bestCount: 2, streak: 3 }, team, "Idolo");
    expect(r.cumFm).toBe(9); // 4 + 5
    expect(r.bestCount).toBe(2); // invariato
    expect(r.streak).toBe(4); // +1
  });
  it("se l'idolo non ha giocato accumula 0 al fantavoto ma cresce la fedeltà", () => {
    const r = nextIdolCounters({ cumFm: 10, bestCount: 1, streak: 2 }, [perf("Tizio", 6, 0)], "Idolo");
    expect(r.cumFm).toBe(10);
    expect(r.bestCount).toBe(1);
    expect(r.streak).toBe(3);
  });
});

describe("idolLevel (calcolo del livello dai contatori)", () => {
  it("appena designato (contatori a 0) è Bronzo", () => {
    expect(idolLevel({ cumFm: 0, bestCount: 0, streak: 0 })).toBe(1);
  });
  it("Argento oltre la prima soglia", () => {
    // score = 5*2 + 20/5 + 1*3 = 17 >= 15
    expect(idolLevel({ cumFm: 20, bestCount: 1, streak: 5 })).toBe(2);
  });
  it("Oro con fedeltà e fantamedia consolidate", () => {
    // score = 10*2 + 60/5 + 3*3 = 41 >= 35
    expect(idolLevel({ cumFm: 60, bestCount: 3, streak: 10 })).toBe(3);
  });
  it("Leggenda con carriera lunga da idolo", () => {
    // score = 22*2 + 120/5 + 8*3 = 92 >= 70
    expect(idolLevel({ cumFm: 120, bestCount: 8, streak: 22 })).toBe(4);
  });
});

describe("idolLevelInfo (progresso verso il prossimo livello)", () => {
  it("Leggenda non ha prossimo livello e progresso pieno", () => {
    const info = idolLevelInfo({ cumFm: 200, bestCount: 15, streak: 40 });
    expect(info.level).toBe(4);
    expect(info.next).toBeNull();
    expect(info.progress).toBe(1);
  });
  it("il progresso è tra 0 e 1 e punta al livello successivo", () => {
    const info = idolLevelInfo({ cumFm: 20, bestCount: 1, streak: 5 }); // Argento
    expect(info.level).toBe(2);
    expect(info.next).toBe(3);
    expect(info.progress).toBeGreaterThanOrEqual(0);
    expect(info.progress).toBeLessThanOrEqual(1);
  });
});

describe("transizione di livello a fine giornata", () => {
  it("una giornata in più può far salire di livello (Bronzo → Argento)", () => {
    const before = { cumFm: 10, bestCount: 0, streak: 6 }; // score 12+2 = 14 → Bronzo
    const after = nextIdolCounters(before, [perf("Idolo", 6, 0)], "Idolo"); // +streak, +fv
    expect(idolLevel(before)).toBe(1);
    expect(idolLevel(after)).toBeGreaterThan(idolLevel(before));
  });
});
