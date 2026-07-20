// Selezione DETERMINISTICA dei tratti dell'avatar a partire dal nome del
// giocatore: stesso nome → stesso personaggio (stabile), nomi diversi →
// combinazioni molto varie. Logica pura, testabile.

// Hash FNV-1a a 32 bit.
export function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Indice deterministico in [0, count) a partire da nome + "sale".
export function pickIndex(name: string, salt: string, count: number): number {
  return hashString(`${name.trim().toLowerCase()}|${salt}`) % count;
}

// Numero di varianti per ciascun tratto (≥ 6-8 → molte combinazioni possibili).
export const TRAIT_COUNTS = {
  face: 8,
  hair: 8,
  hairColor: 8,
  facial: 8,
  skin: 7,
  expr: 8,
  accessory: 8,
} as const;

export interface Traits {
  face: number;
  hair: number;
  hairColor: number;
  facial: number;
  skin: number;
  expr: number;
  accessory: number;
}

export function pickTraits(name: string): Traits {
  return {
    face: pickIndex(name, "face", TRAIT_COUNTS.face),
    hair: pickIndex(name, "hair", TRAIT_COUNTS.hair),
    hairColor: pickIndex(name, "haircolor", TRAIT_COUNTS.hairColor),
    facial: pickIndex(name, "facial", TRAIT_COUNTS.facial),
    skin: pickIndex(name, "skin", TRAIT_COUNTS.skin),
    expr: pickIndex(name, "expr", TRAIT_COUNTS.expr),
    accessory: pickIndex(name, "accessory", TRAIT_COUNTS.accessory),
  };
}

// Combinazioni teoriche totali (per test/documentazione).
export const TOTAL_COMBINATIONS =
  TRAIT_COUNTS.face *
  TRAIT_COUNTS.hair *
  TRAIT_COUNTS.hairColor *
  TRAIT_COUNTS.facial *
  TRAIT_COUNTS.skin *
  TRAIT_COUNTS.expr *
  TRAIT_COUNTS.accessory;
