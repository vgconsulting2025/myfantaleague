// Logica PURA delle skin cosmetiche delle bustine: pool con rarità, estrazione
// pesata e metadati di rarità. Puramente estetiche, slegate dal merito sportivo.

export type Rarity = "comune" | "rara" | "leggendaria";

export interface Skin {
  key: string;
  name: string;
  rarity: Rarity;
  frame: string; // css della cornice (bordo)
  overlay?: string; // css di un pattern sovrapposto all'area immagine
  particles?: boolean; // piccoli effetti particellari
}

export const RARITY_META: Record<Rarity, { label: string; weight: number; glow: string; ring: string; chip: string }> = {
  comune: { label: "Comune", weight: 70, glow: "#94a3b8", ring: "ring-slate-300", chip: "bg-slate-200 text-slate-700" },
  rara: { label: "Rara", weight: 25, glow: "#38bdf8", ring: "ring-sky-400", chip: "bg-sky-100 text-sky-700" },
  leggendaria: { label: "Leggendaria", weight: 5, glow: "#f4e3a0", ring: "ring-[#e9cd6e]", chip: "bg-oro-100 text-oro-700" },
};

export const SKINS: Skin[] = [
  // Comuni
  { key: "notte", name: "Notte", rarity: "comune", frame: "linear-gradient(150deg,#334155,#0f172a)", overlay: "linear-gradient(160deg, rgba(148,163,184,0.15), transparent 60%)" },
  { key: "sabbia", name: "Sabbia", rarity: "comune", frame: "linear-gradient(150deg,#e7cfa3,#b98a4b)", overlay: "repeating-linear-gradient(45deg, rgba(0,0,0,0.05) 0 6px, transparent 6px 12px)" },
  { key: "brace", name: "Brace", rarity: "comune", frame: "linear-gradient(150deg,#7f1d1d,#b45309)", overlay: "radial-gradient(circle at 50% 20%, rgba(255,180,80,0.18), transparent 55%)" },
  // Rare
  { key: "neon", name: "Neon", rarity: "rara", frame: "linear-gradient(150deg,#22d3ee,#a21caf)", overlay: "linear-gradient(120deg, rgba(34,211,238,0.18), transparent 45%, rgba(162,28,175,0.18))" },
  { key: "onde", name: "Onde", rarity: "rara", frame: "linear-gradient(150deg,#0ea5e9,#1e3a8a)", overlay: "repeating-radial-gradient(circle at 50% 120%, rgba(255,255,255,0.08) 0 6px, transparent 6px 16px)" },
  { key: "foresta", name: "Foresta", rarity: "rara", frame: "linear-gradient(150deg,#10b981,#065f46)", overlay: "repeating-linear-gradient(60deg, rgba(255,255,255,0.05) 0 4px, transparent 4px 12px)" },
  // Leggendarie
  { key: "aurora", name: "Aurora", rarity: "leggendaria", frame: "linear-gradient(120deg,#34d399,#818cf8,#22d3ee,#34d399)", overlay: "radial-gradient(circle at 30% 20%, rgba(129,140,248,0.25), transparent 45%), radial-gradient(circle at 70% 60%, rgba(52,211,153,0.25), transparent 50%)", particles: true },
  { key: "cosmo", name: "Cosmo", rarity: "leggendaria", frame: "linear-gradient(150deg,#1e1b4b,#4c1d95,#0b1020)", overlay: "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.5) 0 1px, transparent 2px), radial-gradient(circle at 70% 60%, rgba(255,255,255,0.4) 0 1px, transparent 2px), radial-gradient(circle at 45% 80%, rgba(255,255,255,0.4) 0 1px, transparent 2px)", particles: true },
  { key: "prisma", name: "Prisma", rarity: "leggendaria", frame: "linear-gradient(120deg,#f472b6,#c084fc,#38bdf8,#f4e3a0,#f472b6)", overlay: "linear-gradient(110deg, rgba(255,255,255,0.22), transparent 40%, rgba(255,255,255,0.22))", particles: true },
];

export const PACK_COST = 50;

// Pacchetti di acquisto Fanta Coins con denaro reale (UI; dietro feature flag).
export interface CoinPack {
  key: string;
  label: string;
  coins: number;
  price: string;
}
export const COIN_PACKS: CoinPack[] = [
  { key: "small", label: "Piccolo", coins: 100, price: "0,99 €" },
  { key: "medium", label: "Medio", coins: 550, price: "3,99 €" },
  { key: "large", label: "Grande", coins: 1500, price: "8,99 €" },
];
export function coinPackByKey(key: string): CoinPack | undefined {
  return COIN_PACKS.find((p) => p.key === key);
}

export function skinByKey(key: string): Skin | undefined {
  return SKINS.find((s) => s.key === key);
}

// Estrazione pesata: la probabilità di ciascuna rarità è ripartita tra le skin
// di quella rarità (comune ~70%, rara ~25%, leggendaria ~5%).
export function pickSkin(rng: () => number = Math.random): Skin {
  const counts: Record<Rarity, number> = { comune: 0, rara: 0, leggendaria: 0 };
  for (const s of SKINS) counts[s.rarity]++;
  const weights = SKINS.map((s) => RARITY_META[s.rarity].weight / counts[s.rarity]);
  const total = weights.reduce((a, b) => a + b, 0);
  let x = rng() * total;
  for (let i = 0; i < SKINS.length; i++) {
    x -= weights[i];
    if (x < 0) return SKINS[i];
  }
  return SKINS[SKINS.length - 1];
}
