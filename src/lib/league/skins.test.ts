import { describe, it, expect } from "vitest";
import { SKINS, pickSkin, skinByKey, RARITY_META } from "./skins";

describe("pool skin", () => {
  it("ogni skin ha una rarità valida e c'è almeno una per rarità", () => {
    const rarities = new Set(SKINS.map((s) => s.rarity));
    expect(rarities.has("comune")).toBe(true);
    expect(rarities.has("rara")).toBe(true);
    expect(rarities.has("leggendaria")).toBe(true);
  });
  it("skinByKey trova la skin", () => {
    expect(skinByKey("aurora")?.rarity).toBe("leggendaria");
    expect(skinByKey("inesistente")).toBeUndefined();
  });
});

describe("pickSkin (distribuzione rarità ragionevole)", () => {
  it("con rng controllato estrae in base al peso cumulato", () => {
    // rng che ritorna ~0 → prima skin (una comune)
    expect(pickSkin(() => 0).rarity).toBe("comune");
    // rng ~1 (quasi) → ultima skin (leggendaria)
    expect(pickSkin(() => 0.999999).rarity).toBe("leggendaria");
  });

  it("su molte estrazioni: comune > rara > leggendaria e leggendaria è davvero rara", () => {
    const counts: Record<string, number> = { comune: 0, rara: 0, leggendaria: 0 };
    const N = 6000;
    let seed = 12345;
    const rng = () => {
      // LCG deterministico per un test riproducibile
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (let i = 0; i < N; i++) counts[pickSkin(rng).rarity]++;
    expect(counts.comune).toBeGreaterThan(counts.rara);
    expect(counts.rara).toBeGreaterThan(counts.leggendaria);
    expect(counts.comune / N).toBeGreaterThan(0.55); // ~70%
    expect(counts.leggendaria / N).toBeLessThan(0.12); // ~5%
  });

  it("i pesi di rarità rispettano l'ordine comune > rara > leggendaria", () => {
    expect(RARITY_META.comune.weight).toBeGreaterThan(RARITY_META.rara.weight);
    expect(RARITY_META.rara.weight).toBeGreaterThan(RARITY_META.leggendaria.weight);
  });
});
