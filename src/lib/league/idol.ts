// Logica PURA del "Giocatore Idolo": vincolo anti-abuso sul cambio (max 1 per
// giornata), calcolo del "migliore in campo" e avanzamento dei contatori di
// progresso a fine giornata. Testabile e indipendente dal DB.

// Prestazione minima di un giocatore in una giornata (sottoinsieme di
// PerformanceInput: compatibile per struttura, senza dipendenze circolari).
export interface IdolPerf {
  playerName: string;
  vote: number;
  bonus: number;
  fielded: boolean;
}

export interface IdolCounters {
  cumFm: number; // fantamedia cumulata giornata per giornata
  bestCount: number; // giornate da migliore in campo
  streak: number; // giornate consecutive da idolo
}

export const fantavoto = (p: IdolPerf): number => p.vote + p.bonus;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Un cambio dell'idolo verso un giocatore DIVERSO è consentito al massimo una
// volta per giornata: deve essere passata almeno una nuova giornata dall'ultima
// designazione. La prima designazione (nessun idolo) è sempre consentita.
export function canChangeIdol(
  currentIdolPlayerId: string | null,
  idolSetGiornata: number | null,
  latestGiornata: number,
): boolean {
  if (!currentIdolPlayerId || idolSetGiornata == null) return true;
  return latestGiornata > idolSetGiornata;
}

// L'idolo è "migliore in campo" se è sceso in campo (titolare) e ha il fantavoto
// più alto tra i titolari della propria squadra (a parità conta come migliore).
export function isBestInField(teamPerfs: IdolPerf[], idolName: string): boolean {
  const idol = teamPerfs.find((p) => p.playerName === idolName);
  if (!idol || !idol.fielded) return false;
  const fielded = teamPerfs.filter((p) => p.fielded);
  if (fielded.length === 0) return false;
  const max = Math.max(...fielded.map(fantavoto));
  return fantavoto(idol) >= max;
}

// Avanzamento dei contatori a fine giornata: accumula il fantavoto dell'idolo,
// +1 se è stato il migliore in campo, +1 di fedeltà (resta idolo un'altra
// giornata). Se l'idolo non compare tra le prestazioni, accumula 0 al fantavoto.
export function nextIdolCounters(
  prev: IdolCounters,
  teamPerfs: IdolPerf[],
  idolName: string,
): IdolCounters {
  const idol = teamPerfs.find((p) => p.playerName === idolName);
  const fv = idol ? fantavoto(idol) : 0;
  const best = isBestInField(teamPerfs, idolName);
  return {
    cumFm: round2(prev.cumFm + fv),
    bestCount: prev.bestCount + (best ? 1 : 0),
    streak: prev.streak + 1,
  };
}

/* ---------------- Livelli di progressione dell'idolo ---------------- */

// 1 Bronzo · 2 Argento · 3 Oro · 4 Leggenda. I contatori crescono in modo
// monotòno mentre l'idolo resta tale, quindi il livello non scende mai.
export type IdolLevel = 1 | 2 | 3 | 4;

// Nota: il livello 3 NON è "Oro" — l'oro è riservato alla variante "rara" da
// fantamedia. I livelli idolo hanno una progressione cromatica propria.
export const IDOL_LEVEL_META: Record<IdolLevel, { key: string; label: string }> = {
  1: { key: "bronzo", label: "Bronzo" },
  2: { key: "argento", label: "Argento" },
  3: { key: "verde", label: "Verde Idolo" },
  4: { key: "leggenda", label: "Leggenda" },
};

// Punteggio idolo: pesa maggiormente la fedeltà (giornate da idolo) e la
// fantamedia cumulata, con un contributo minore dalle giornate da migliore in
// campo. Valori di partenza plausibili, calibrabili in seguito.
export function idolScore(c: IdolCounters): number {
  return c.streak * 2 + c.cumFm / 5 + c.bestCount * 3;
}

// Soglie di punteggio per ciascun livello, dal più alto. Calibrabili.
export const IDOL_LEVEL_THRESHOLDS: { level: IdolLevel; min: number }[] = [
  { level: 4, min: 70 },
  { level: 3, min: 35 },
  { level: 2, min: 15 },
  { level: 1, min: 0 },
];

export function idolLevel(c: IdolCounters): IdolLevel {
  const score = idolScore(c);
  for (const t of IDOL_LEVEL_THRESHOLDS) {
    if (score >= t.min) return t.level;
  }
  return 1;
}

// Livello corrente + prossimo + progresso (0..1) verso il prossimo livello,
// per la barra di avanzamento nel pannello progressi.
export interface IdolLevelInfo {
  level: IdolLevel;
  next: IdolLevel | null;
  score: number;
  currentMin: number;
  nextMin: number | null;
  progress: number; // 0..1; 1 se già Leggenda
}

export function idolLevelInfo(c: IdolCounters): IdolLevelInfo {
  const level = idolLevel(c);
  const score = idolScore(c);
  const currentMin = IDOL_LEVEL_THRESHOLDS.find((t) => t.level === level)!.min;
  const next: IdolLevel | null = level < 4 ? ((level + 1) as IdolLevel) : null;
  const nextMin = next ? IDOL_LEVEL_THRESHOLDS.find((t) => t.level === next)!.min : null;
  const progress =
    nextMin != null ? Math.max(0, Math.min(1, (score - currentMin) / (nextMin - currentMin))) : 1;
  return { level, next, score, currentMin, nextMin, progress };
}
