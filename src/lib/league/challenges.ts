// Logica PURA delle sfide giornaliere: pool e generazione deterministica per
// giornata (si rinnovano a ogni giornata simulata). Testabile.

export interface ChallengeDef {
  key: string;
  description: string;
  reward: number; // Fanta Coins alla riuscita
}

export const CHALLENGE_POOL: ChallengeDef[] = [
  { key: "simula_giornata", description: "Simula una giornata", reward: 15 },
  { key: "designa_idolo", description: "Designa il tuo idolo", reward: 20 },
  { key: "decidi_scambio", description: "Accetta o rifiuta una proposta di scambio", reward: 15 },
  { key: "vota_allenatore", description: "Vota un allenatore nella bacheca", reward: 10 },
  { key: "chiama_agente", description: "Chiama l'Agente sul mercato", reward: 10 },
  { key: "apri_bustina", description: "Apri una bustina", reward: 10 },
];

// Genera N sfide per una giornata: sempre "simula_giornata" + una rotazione
// deterministica delle altre (stessa giornata → stesse sfide; giornate diverse
// → sfide diverse). Così il set è riproducibile e testabile.
export function generateChallenges(giornata: number, n = 3): ChallengeDef[] {
  const count = Math.max(1, Math.min(n, CHALLENGE_POOL.length));
  const sim = CHALLENGE_POOL.find((c) => c.key === "simula_giornata")!;
  const others = CHALLENGE_POOL.filter((c) => c.key !== "simula_giornata");
  const g = ((giornata % others.length) + others.length) % others.length;
  const rotated = others.map((_, i) => others[(g + i) % others.length]);
  return [sim, ...rotated].slice(0, count);
}
