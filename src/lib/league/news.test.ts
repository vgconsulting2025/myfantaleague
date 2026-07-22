import { describe, it, expect } from "vitest";
import {
  announceSquadTrade,
  outcomeSquadTrade,
  announceFreeAgent,
  outcomeFreeAgent,
} from "./news";

describe("articolo di proposta — scambio tra squadre", () => {
  it("annuncia la proposta citando le due squadre e i giocatori", () => {
    const a = announceSquadTrade(
      [{ give: "Lautaro", receive: "Thuram", otherTeam: "AC Sciacallo" }],
      "Real Divano",
    );
    expect(a.category).toBe("MERCATO");
    expect(a.title).toContain("Real Divano");
    expect(a.title).toContain("AC Sciacallo");
    expect(`${a.body}`).toMatch(/Lautaro|Thuram/);
  });
});

describe("articolo di esito — scambio tra squadre", () => {
  it("distingue accettazione e rifiuto", () => {
    const ok = outcomeSquadTrade("Real Divano", "AC Sciacallo", "Lautaro", "Thuram", true);
    const no = outcomeSquadTrade("Real Divano", "AC Sciacallo", "Lautaro", "Thuram", false);
    expect(ok.title).not.toBe(no.title);
    expect(ok.body).toContain("Thuram");
    expect(no.body).toMatch(/Lautaro|Thuram/);
  });
});

describe("articolo di proposta/esito — svincolati", () => {
  it("annuncia lo svincolato verso la squadra", () => {
    const a = announceFreeAgent("Real Divano", "Falcone", "Meret", "Napoli");
    expect(a.category).toBe("SVINCOLATI");
    expect(a.title).toContain("Meret");
    expect(a.body).toContain("Real Divano");
  });
  it("distingue esito accettato e rifiutato", () => {
    const ok = outcomeFreeAgent("Real Divano", "Falcone", "Meret", true);
    const no = outcomeFreeAgent("Real Divano", "Falcone", "Meret", false);
    expect(ok.category).toBe("SVINCOLATI");
    expect(ok.title).not.toBe(no.title);
  });
});
