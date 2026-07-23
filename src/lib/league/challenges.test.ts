import { describe, it, expect } from "vitest";
import { generateChallenges, CHALLENGE_POOL } from "./challenges";

describe("generateChallenges (sfide giornaliere)", () => {
  it("genera N sfide includendo sempre 'simula_giornata'", () => {
    const c = generateChallenges(1, 3);
    expect(c).toHaveLength(3);
    expect(c[0].key).toBe("simula_giornata");
    expect(c.every((x) => typeof x.reward === "number" && x.reward > 0)).toBe(true);
  });

  it("è deterministica per giornata (reset riproducibile)", () => {
    expect(generateChallenges(4, 3)).toEqual(generateChallenges(4, 3));
  });

  it("giornate diverse ruotano le sfide (si rinnovano)", () => {
    const a = generateChallenges(1, 3).map((c) => c.key);
    const b = generateChallenges(2, 3).map((c) => c.key);
    expect(a).not.toEqual(b);
  });

  it("clampa il numero di sfide tra 1 e la dimensione del pool", () => {
    expect(generateChallenges(1, 0)).toHaveLength(1);
    expect(generateChallenges(1, 99)).toHaveLength(CHALLENGE_POOL.length);
  });
});
