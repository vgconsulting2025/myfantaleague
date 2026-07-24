// Logica PURA delle carte giocatore delle bustine: rarità, tipi di bustina con
// pesi, estrazione della rarità (con garanzia), rilevamento doppioni e rimborso,
// disponibilità della bustina gratuita giornaliera. Testabile, senza DB.

export type CardRarity = "classica" | "speciale" | "iconica";

export const RARITY_ORDER: CardRarity[] = ["classica", "speciale", "iconica"];

export interface RarityMeta {
  label: string;
  refund: number; // rimborso in coins per un doppione
  chip: string; // classi tailwind per il chip rarità
  glow: string; // colore del glow nel reveal
}

// Palette DISTINTE da idolo (bronzo/argento/verde/leggenda) e da "rara" (oro):
// classica = blu/ciano, speciale = magenta/fucsia, iconica = teal olografico.
export const RARITY_META: Record<CardRarity, RarityMeta> = {
  classica: { label: "Classica", refund: 8, chip: "bg-sky-100 text-sky-700", glow: "#38bdf8" },
  speciale: { label: "Speciale", refund: 20, chip: "bg-fuchsia-100 text-fuchsia-700", glow: "#d946ef" },
  iconica: { label: "Iconica", refund: 55, chip: "bg-teal-100 text-teal-700", glow: "#2dd4bf" },
};

export interface PackType {
  key: string;
  label: string;
  cost: number;
  weights: Record<CardRarity, number>;
}

export const PACK_TYPES: PackType[] = [
  {
    key: "economica",
    label: "Economica",
    cost: 40,
    weights: { classica: 78, speciale: 20, iconica: 2 },
  },
  {
    key: "premium",
    label: "Premium",
    cost: 120,
    weights: { classica: 50, speciale: 30, iconica: 20 },
  },
];

export function packTypeByKey(key: string): PackType | undefined {
  return PACK_TYPES.find((p) => p.key === key);
}

export const GUARANTEE_EVERY = 10;

// La bustina numero N (multipli di 10) garantisce almeno una Speciale.
export function isGuaranteedPack(newPackCount: number): boolean {
  return newPackCount > 0 && newPackCount % GUARANTEE_EVERY === 0;
}

// Estrazione pesata della rarità. Se `guaranteed`, esclude la Classica.
export function pickRarity(
  pack: PackType,
  guaranteed: boolean,
  rng: () => number = Math.random,
): CardRarity {
  const entries = RARITY_ORDER.filter((r) => !(guaranteed && r === "classica"));
  const total = entries.reduce((s, r) => s + pack.weights[r], 0);
  let x = rng() * total;
  for (const r of entries) {
    x -= pack.weights[r];
    if (x < 0) return r;
  }
  return entries[entries.length - 1];
}

// Doppione: stessa carta (giocatore + rarità) già posseduta.
export function isDuplicate(
  owned: { playerId: string; rarity: string }[],
  playerId: string,
  rarity: CardRarity,
): boolean {
  return owned.some((c) => c.playerId === playerId && c.rarity === rarity);
}

// Bustina gratuita giornaliera: disponibile una volta per giornata simulata.
export function freePackAvailable(freePackGiornata: number | null, latestGiornata: number): boolean {
  return freePackGiornata !== latestGiornata;
}

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
