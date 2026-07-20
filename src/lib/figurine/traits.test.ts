import { describe, it, expect } from "vitest";
import { pickTraits, pickIndex, TRAIT_COUNTS, TOTAL_COMBINATIONS } from "./traits";

describe("pickTraits", () => {
  it("è deterministico: stesso nome → stessi tratti", () => {
    expect(pickTraits("Lautaro")).toEqual(pickTraits("Lautaro"));
    // insensibile a spazi/maiuscole
    expect(pickTraits("  lautaro ")).toEqual(pickTraits("Lautaro"));
  });

  it("produce indici entro i limiti di ogni tratto", () => {
    for (const name of ["Sommer", "Barella", "Dybala", "McTominay", "Nico Paz"]) {
      const t = pickTraits(name);
      expect(t.face).toBeGreaterThanOrEqual(0);
      expect(t.face).toBeLessThan(TRAIT_COUNTS.face);
      expect(t.skin).toBeLessThan(TRAIT_COUNTS.skin);
      expect(t.expr).toBeLessThan(TRAIT_COUNTS.expr);
      expect(t.accessory).toBeLessThan(TRAIT_COUNTS.accessory);
    }
  });

  it("genera varietà tra nomi diversi", () => {
    const names = [
      "Sommer", "Bastoni", "Barella", "Lautaro", "Kean", "Maignan",
      "Pulisic", "Retegui", "Thuram", "Svilar", "Vlahovic", "Dybala",
      "Lookman", "McTominay", "Calhanoglu", "Raspadori", "Nico Paz", "Koné",
    ];
    const faces = new Set(names.map((n) => pickTraits(n).face));
    const hairs = new Set(names.map((n) => pickTraits(n).hair));
    // Con 18 nomi ci aspettiamo diverse varianti distinte, non tutte uguali.
    expect(faces.size).toBeGreaterThan(3);
    expect(hairs.size).toBeGreaterThan(3);
  });

  it("offre un numero molto alto di combinazioni", () => {
    expect(TOTAL_COMBINATIONS).toBeGreaterThan(1_000_000);
  });

  it("pickIndex resta nel range richiesto", () => {
    for (let i = 0; i < 50; i++) {
      expect(pickIndex(`n${i}`, "salt", 8)).toBeLessThan(8);
      expect(pickIndex(`n${i}`, "salt", 8)).toBeGreaterThanOrEqual(0);
    }
  });
});
