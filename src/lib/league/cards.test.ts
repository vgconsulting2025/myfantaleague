import { describe, it, expect } from "vitest";
import {
  pickRarity,
  isGuaranteedPack,
  isDuplicate,
  freePackAvailable,
  packTypeByKey,
  RARITY_META,
  GUARANTEE_EVERY,
  type CardRarity,
} from "./cards";

const eco = packTypeByKey("economica")!;
const premium = packTypeByKey("premium")!;

function lcg(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

describe("pickRarity (probabilità ragionevoli)", () => {
  it("estrae in base al peso cumulato con rng controllato", () => {
    expect(pickRarity(eco, false, () => 0)).toBe("classica");
    expect(pickRarity(eco, false, () => 0.999999)).toBe("iconica");
  });

  it("Economica: Classica dominante, Iconica molto rara", () => {
    const c: Record<string, number> = { classica: 0, speciale: 0, iconica: 0 };
    const rng = lcg(7);
    const N = 6000;
    for (let i = 0; i < N; i++) c[pickRarity(eco, false, rng)]++;
    expect(c.classica).toBeGreaterThan(c.speciale);
    expect(c.speciale).toBeGreaterThan(c.iconica);
    expect(c.classica / N).toBeGreaterThan(0.6);
    expect(c.iconica / N).toBeLessThan(0.08);
  });

  it("Premium: Iconica molto più probabile che nell'Economica", () => {
    const rng1 = lcg(1);
    const rng2 = lcg(1);
    let ecoIco = 0;
    let premIco = 0;
    const N = 4000;
    for (let i = 0; i < N; i++) {
      if (pickRarity(eco, false, rng1) === "iconica") ecoIco++;
      if (pickRarity(premium, false, rng2) === "iconica") premIco++;
    }
    expect(premIco).toBeGreaterThan(ecoIco);
  });

  it("con garanzia non estrae mai Classica (Speciale o superiore)", () => {
    const rng = lcg(3);
    for (let i = 0; i < 500; i++) {
      const r = pickRarity(eco, true, rng) as CardRarity;
      expect(r).not.toBe("classica");
    }
  });
});

describe("isGuaranteedPack (garanzia al decimo)", () => {
  it("le bustine multiple di 10 sono garantite", () => {
    expect(isGuaranteedPack(10)).toBe(true);
    expect(isGuaranteedPack(20)).toBe(true);
    expect(isGuaranteedPack(GUARANTEE_EVERY)).toBe(true);
    expect(isGuaranteedPack(9)).toBe(false);
    expect(isGuaranteedPack(11)).toBe(false);
    expect(isGuaranteedPack(0)).toBe(false);
  });
});

describe("isDuplicate + rimborsi", () => {
  const owned = [
    { playerId: "p1", rarity: "classica" },
    { playerId: "p1", rarity: "speciale" },
  ];
  it("riconosce il doppione (stesso giocatore + rarità)", () => {
    expect(isDuplicate(owned, "p1", "classica")).toBe(true);
    expect(isDuplicate(owned, "p1", "iconica")).toBe(false);
    expect(isDuplicate(owned, "p2", "classica")).toBe(false);
  });
  it("il rimborso cresce con la rarità", () => {
    expect(RARITY_META.speciale.refund).toBeGreaterThan(RARITY_META.classica.refund);
    expect(RARITY_META.iconica.refund).toBeGreaterThan(RARITY_META.speciale.refund);
  });
});

describe("freePackAvailable (gratis 1/giornata)", () => {
  it("disponibile se non riscattata nella giornata corrente", () => {
    expect(freePackAvailable(null, 3)).toBe(true);
    expect(freePackAvailable(2, 3)).toBe(true);
    expect(freePackAvailable(3, 3)).toBe(false);
  });
});
