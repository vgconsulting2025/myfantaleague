// Logica PURA del "Rivale storico": vincolo anti-abuso sul cambio (max 1 per
// giornata), esito del derby e aggiornamento dello storico degli scontri diretti
// (vittorie/pareggi/sconfitte + punteggio totale). Testabile, indipendente dal DB.

export interface RivalCounters {
  wins: number;
  draws: number;
  losses: number;
  pointsFor: number; // punteggio totale della propria squadra nei derby
  pointsAgainst: number; // punteggio totale del rivale nei derby
  derbies: number; // numero di derby giocati
}

export type DerbyOutcome = "win" | "draw" | "loss";

const EMPTY: RivalCounters = {
  wins: 0,
  draws: 0,
  losses: 0,
  pointsFor: 0,
  pointsAgainst: 0,
  derbies: 0,
};

export function emptyRivalCounters(): RivalCounters {
  return { ...EMPTY };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// Un cambio del rivale verso una squadra diversa è consentito al massimo una
// volta per giornata: serve che sia passata almeno una nuova giornata dall'ultima
// scelta. La prima scelta (nessun rivale) è sempre consentita.
export function canChangeRival(
  currentRivalId: string | null,
  setGiornata: number | null,
  latestGiornata: number,
): boolean {
  if (!currentRivalId || setGiornata == null) return true;
  return latestGiornata > setGiornata;
}

// Esito del derby dal punto di vista della propria squadra.
export function derbyOutcome(userScore: number, rivalScore: number): DerbyOutcome {
  if (userScore > rivalScore) return "win";
  if (userScore < rivalScore) return "loss";
  return "draw";
}

// Aggiorna lo storico dei derby con un nuovo scontro diretto.
export function applyDerbyResult(
  prev: RivalCounters,
  userScore: number,
  rivalScore: number,
): RivalCounters {
  const o = derbyOutcome(userScore, rivalScore);
  return {
    wins: prev.wins + (o === "win" ? 1 : 0),
    draws: prev.draws + (o === "draw" ? 1 : 0),
    losses: prev.losses + (o === "loss" ? 1 : 0),
    pointsFor: round1(prev.pointsFor + userScore),
    pointsAgainst: round1(prev.pointsAgainst + rivalScore),
    derbies: prev.derbies + 1,
  };
}
