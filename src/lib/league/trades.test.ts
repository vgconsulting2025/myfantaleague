import { describe, it, expect } from "vitest";
import { validateProposals, applyTrade } from "./trades";
import type { LeagueTeam, LeaguePlayer, Role, TradeProposal } from "./types";

function player(name: string, role: Role): LeaguePlayer {
  return { id: `${name}`, name, role, club: "Club", quota: 20, fm: 6.5 };
}

function team(name: string, isUser: boolean, players: LeaguePlayer[]): LeagueTeam {
  return { id: name, slug: name.toLowerCase(), name, president: "P", points: 0, isUser, players };
}

const userTeam = team("Real Divano", true, [player("Lautaro", "A"), player("Barella", "C")]);
const other = team("AC Sciacallo", false, [player("Thuram", "A"), player("Pulisic", "C")]);

describe("validateProposals", () => {
  it("accetta una proposta valida e la arricchisce coi giocatori", () => {
    const proposals: TradeProposal[] = [
      {
        otherTeam: "AC Sciacallo",
        give: "Lautaro",
        receive: "Thuram",
        rationale: "Scambio tra bomber.",
        agentComment: "Affare!",
      },
    ];
    const valid = validateProposals(proposals, userTeam, [other]);
    expect(valid).toHaveLength(1);
    expect(valid[0].id).toBe(0);
    expect(valid[0].status).toBe("pending");
    expect(valid[0].givePlayer?.name).toBe("Lautaro");
    expect(valid[0].receivePlayer?.name).toBe("Thuram");
  });

  it("scarta proposte con squadra o giocatori inesistenti", () => {
    const proposals: TradeProposal[] = [
      { otherTeam: "Inesistente", give: "Lautaro", receive: "Thuram", rationale: "", agentComment: "" },
      { otherTeam: "AC Sciacallo", give: "Nessuno", receive: "Thuram", rationale: "", agentComment: "" },
      { otherTeam: "AC Sciacallo", give: "Barella", receive: "Fantasma", rationale: "", agentComment: "" },
    ];
    const valid = validateProposals(proposals, userTeam, [other]);
    expect(valid).toHaveLength(0);
  });

  it("assegna id sequenziali solo alle proposte valide", () => {
    const proposals: TradeProposal[] = [
      { otherTeam: "Inesistente", give: "Lautaro", receive: "Thuram", rationale: "", agentComment: "" },
      { otherTeam: "AC Sciacallo", give: "Lautaro", receive: "Thuram", rationale: "", agentComment: "" },
      { otherTeam: "AC Sciacallo", give: "Barella", receive: "Pulisic", rationale: "", agentComment: "" },
    ];
    const valid = validateProposals(proposals, userTeam, [other]);
    expect(valid.map((p) => p.id)).toEqual([0, 1]);
  });
});

describe("applyTrade", () => {
  it("scambia i due giocatori tra le rose", () => {
    const { userPlayers, otherPlayers } = applyTrade(userTeam, other, "Lautaro", "Thuram");
    const userNames = userPlayers.map((p) => p.name);
    const otherNames = otherPlayers.map((p) => p.name);

    expect(userNames).toContain("Thuram");
    expect(userNames).not.toContain("Lautaro");
    expect(otherNames).toContain("Lautaro");
    expect(otherNames).not.toContain("Thuram");
    // Le rose originali non vengono mutate.
    expect(userTeam.players.map((p) => p.name)).toContain("Lautaro");
  });

  it("lancia un errore se un giocatore non è nella rosa attesa", () => {
    expect(() => applyTrade(userTeam, other, "Sconosciuto", "Thuram")).toThrow();
    expect(() => applyTrade(userTeam, other, "Lautaro", "Sconosciuto")).toThrow();
  });
});
