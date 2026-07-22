import { describe, it, expect } from "vitest";
import { isBalancedMatch, pickFreeAgentMatch } from "./freeagents";
import type { LeaguePlayer, LeagueTeam, Role } from "./types";

function player(name: string, role: Role, quota: number, fm: number): LeaguePlayer {
  return { id: name, name, role, club: "Club", quota, fm };
}

function team(name: string, players: LeaguePlayer[]): LeagueTeam {
  return { id: name, slug: name.toLowerCase(), name, president: "P", points: 0, isUser: true, players };
}

describe("isBalancedMatch", () => {
  it("accetta stesso ruolo, fm migliore e quotazione vicina", () => {
    expect(isBalancedMatch(player("A", "C", 20, 6.0), player("B", "C", 24, 6.5))).toBe(true);
  });
  it("rifiuta ruoli diversi", () => {
    expect(isBalancedMatch(player("A", "C", 20, 6.0), player("B", "A", 20, 6.5))).toBe(false);
  });
  it("rifiuta fm inferiore o quotazione troppo distante", () => {
    expect(isBalancedMatch(player("A", "C", 20, 6.5), player("B", "C", 20, 5.5))).toBe(false);
    expect(isBalancedMatch(player("A", "C", 20, 6.0), player("B", "C", 40, 6.5))).toBe(false);
  });
});

describe("pickFreeAgentMatch", () => {
  const t = team("Real Divano", [
    player("Portiere", "P", 12, 6.2),
    player("DifBuono", "D", 20, 6.6),
    player("CenScarso", "C", 16, 5.8), // reparto più debole
  ]);

  it("propone di rinforzare il reparto più debole con uno svincolato migliore", () => {
    const freeAgents = [
      player("CenTop", "C", 18, 6.9), // compatibile col centrocampista scarso
      player("AttRandom", "A", 30, 7.2), // ruolo non presente in rosa
    ];
    const match = pickFreeAgentMatch(t, freeAgents, () => 0);
    expect(match).not.toBeNull();
    expect(match!.give.name).toBe("CenScarso");
    expect(match!.fa.name).toBe("CenTop");
    expect(match!.fa.role).toBe(match!.give.role);
    expect(match!.fa.fm).toBeGreaterThanOrEqual(match!.give.fm);
  });

  it("restituisce null se nessuno svincolato è compatibile", () => {
    expect(pickFreeAgentMatch(t, [player("Boh", "P", 40, 5.0)], () => 0)).toBeNull();
  });
});
