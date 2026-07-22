// Logica PURA per gli scambi con gli svincolati: valutazione dell'equilibrio di
// un match e scelta di una proposta statisticamente sensata (rinforza il reparto
// più debole con uno svincolato di pari ruolo, fantamedia migliore e quotazione
// comparabile). Testabile.

import type { LeaguePlayer, LeagueTeam, Role } from "./types";

export const QUOTA_TOLERANCE = 10;

const ROLE_IT: Record<Role, string> = {
  P: "portiere",
  D: "difensore",
  C: "centrocampista",
  A: "attaccante",
};

// Un match è equilibrato: stesso ruolo, svincolato con fm >= del ceduto,
// quotazioni comparabili (entro tolleranza).
export function isBalancedMatch(give: LeaguePlayer, fa: LeaguePlayer): boolean {
  return (
    give.role === fa.role &&
    fa.fm >= give.fm - 0.1 &&
    Math.abs(give.quota - fa.quota) <= QUOTA_TOLERANCE
  );
}

export interface FAMatch {
  team: LeagueTeam;
  give: LeaguePlayer;
  fa: LeaguePlayer;
}

// Sceglie una proposta svincolato per una squadra: parte dal reparto più debole
// e sostituisce il suo peggior giocatore con uno svincolato migliore e compatibile.
export function pickFreeAgentMatch(
  team: LeagueTeam,
  freeAgents: LeaguePlayer[],
  rng: () => number = Math.random,
): FAMatch | null {
  const roles: Role[] = ["P", "D", "C", "A"];
  const byWeakness = roles
    .map((role) => {
      const ps = team.players.filter((p) => p.role === role);
      const avg = ps.length ? ps.reduce((s, p) => s + p.fm, 0) / ps.length : Infinity;
      return { role, avg, count: ps.length };
    })
    .filter((x) => x.count > 0)
    .sort((a, b) => a.avg - b.avg);

  for (const { role } of byWeakness) {
    const worst = team.players
      .filter((p) => p.role === role)
      .sort((a, b) => a.fm - b.fm)[0];
    if (!worst) continue;
    const candidates = freeAgents
      .filter((fa) => isBalancedMatch(worst, fa))
      .sort((a, b) => b.fm - a.fm);
    if (candidates.length) {
      const idx = Math.floor(rng() * Math.min(candidates.length, 3));
      return { team, give: worst, fa: candidates[idx] ?? candidates[0] };
    }
  }
  return null;
}

export function freeAgentRationale(match: FAMatch): string {
  const { team, give, fa } = match;
  return `${team.name} è corta a ${ROLE_IT[fa.role]}: liberando ${give.name} (fm ${give.fm.toFixed(1)}) può prendere lo svincolato ${fa.name} (fm ${fa.fm.toFixed(1)}, ex ${fa.club}), quotazioni vicine (${give.quota} vs ${fa.quota}).`;
}

export function freeAgentComment(): string {
  const options = [
    "Affare da chiudere prima che se lo prendano gli altri.",
    "Fidatevi, è un colpo da novanta.",
    "Uno svincolato così non capita due volte.",
    "Ci metto la faccia, presidente.",
    "Sveglia, il mercato non aspetta.",
  ];
  return options[Math.floor(Math.random() * options.length)];
}
