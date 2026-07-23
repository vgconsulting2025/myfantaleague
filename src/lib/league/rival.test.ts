import { describe, it, expect } from "vitest";
import { canChangeRival, derbyOutcome, applyDerbyResult, emptyRivalCounters } from "./rival";

describe("canChangeRival (vincolo 1 cambio per giornata)", () => {
  it("la prima scelta è sempre consentita", () => {
    expect(canChangeRival(null, null, 5)).toBe(true);
  });
  it("non permette un secondo cambio nella stessa giornata", () => {
    expect(canChangeRival("t1", 5, 5)).toBe(false);
  });
  it("permette il cambio dopo una nuova giornata", () => {
    expect(canChangeRival("t1", 5, 6)).toBe(true);
  });
});

describe("derbyOutcome", () => {
  it("distingue vittoria, pareggio e sconfitta", () => {
    expect(derbyOutcome(70, 65)).toBe("win");
    expect(derbyOutcome(60, 72)).toBe("loss");
    expect(derbyOutcome(68, 68)).toBe("draw");
  });
});

describe("applyDerbyResult (tracciamento scontri diretti)", () => {
  it("aggiorna V/P/S, punteggi totali e numero derby su una serie", () => {
    let r = emptyRivalCounters();
    r = applyDerbyResult(r, 72, 65); // vittoria
    expect(r).toEqual({ wins: 1, draws: 0, losses: 0, pointsFor: 72, pointsAgainst: 65, derbies: 1 });
    r = applyDerbyResult(r, 60.5, 72); // sconfitta
    expect(r).toEqual({ wins: 1, draws: 0, losses: 1, pointsFor: 132.5, pointsAgainst: 137, derbies: 2 });
    r = applyDerbyResult(r, 68, 68); // pareggio
    expect(r).toEqual({ wins: 1, draws: 1, losses: 1, pointsFor: 200.5, pointsAgainst: 205, derbies: 3 });
  });
});
