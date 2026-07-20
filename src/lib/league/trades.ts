// Logica PURA di validazione ed esecuzione degli scambi.
// Nessun accesso a DB o rete: facilmente testabile (vedi trades.test.ts).
// Porta la stessa logica del prototipo MyFantaLeague.jsx (filtro proposte + swap).

import type { LeagueTeam, LeaguePlayer, TradeProposal, EnrichedProposal } from "./types";

/**
 * Valida le proposte dell'Agente contro le rose reali e le arricchisce coi dati
 * dei giocatori. Scarta ogni proposta in cui:
 *  - la squadra avversaria indicata non esiste,
 *  - il giocatore ceduto non è nella rosa dell'utente,
 *  - il giocatore ricevuto non è nella rosa dell'avversario indicato.
 */
export function validateProposals(
  proposals: TradeProposal[],
  userTeam: LeagueTeam,
  otherTeams: LeagueTeam[],
): EnrichedProposal[] {
  const valid: EnrichedProposal[] = [];
  for (const p of proposals) {
    if (!p || typeof p !== "object") continue;
    const other = otherTeams.find((t) => t.name === p.otherTeam);
    if (!other) continue;
    const givePlayer = userTeam.players.find((pl) => pl.name === p.give) ?? null;
    const receivePlayer = other.players.find((pl) => pl.name === p.receive) ?? null;
    if (!givePlayer || !receivePlayer) continue;
    valid.push({
      id: valid.length,
      status: "pending",
      otherTeam: p.otherTeam,
      give: p.give,
      receive: p.receive,
      rationale: String(p.rationale ?? ""),
      agentComment: String(p.agentComment ?? ""),
      givePlayer,
      receivePlayer,
    });
  }
  return valid;
}

/**
 * Esegue lo scambio in memoria: restituisce le nuove rose delle due squadre con
 * i due giocatori scambiati. Lancia un errore se un giocatore non è più presente
 * (scambio non più valido).
 */
export function applyTrade(
  userTeam: LeagueTeam,
  otherTeam: LeagueTeam,
  giveName: string,
  receiveName: string,
): { userPlayers: LeaguePlayer[]; otherPlayers: LeaguePlayer[] } {
  const giveIdx = userTeam.players.findIndex((p) => p.name === giveName);
  const recvIdx = otherTeam.players.findIndex((p) => p.name === receiveName);
  if (giveIdx < 0) throw new Error(`"${giveName}" non è nella rosa di ${userTeam.name}`);
  if (recvIdx < 0) throw new Error(`"${receiveName}" non è nella rosa di ${otherTeam.name}`);

  const userPlayers = [...userTeam.players];
  const otherPlayers = [...otherTeam.players];
  const mine = userPlayers[giveIdx];
  const theirs = otherPlayers[recvIdx];
  userPlayers[giveIdx] = theirs;
  otherPlayers[recvIdx] = mine;
  return { userPlayers, otherPlayers };
}
