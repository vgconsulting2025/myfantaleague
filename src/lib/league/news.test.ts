import { describe, it, expect } from "vitest";
import {
  announceSquadTrade,
  outcomeSquadTrade,
  announceFreeAgent,
  outcomeFreeAgent,
  announceIdol,
  announceIdolLevelUp,
  derbyArticle,
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

describe("articolo — designazione idolo", () => {
  it("annuncia il nuovo idolo citando squadra e giocatore", () => {
    const a = announceIdol("Real Divano", "Lautaro");
    expect(a.category).toBe("IDOLO");
    expect(a.title).toContain("Lautaro");
    expect(`${a.title} ${a.body}`).toContain("Real Divano");
  });
});

describe("articolo — salita di livello idolo", () => {
  it("annuncia la salita citando il livello (Verde) ed è distinto dalla designazione", () => {
    const up = announceIdolLevelUp("Real Divano", "Barella", 3);
    expect(up.category).toBe("IDOLO");
    expect(up.kicker).toBe("Salita di livello");
    expect(`${up.title} ${up.body}`).toContain("Barella");
    expect(`${up.title} ${up.body}`).toMatch(/Verde/);
    // diverso dall'articolo di semplice designazione
    expect(up.kicker).not.toBe(announceIdol("Real Divano", "Barella").kicker);
  });
});

describe("articolo — derby col rivale storico", () => {
  it("cita le due squadre, il punteggio e il computo storico degli scontri", () => {
    const a = derbyArticle("Real Divano", "AC Sciacallo", 72, 65, {
      wins: 3,
      draws: 1,
      losses: 2,
      pointsFor: 400,
      pointsAgainst: 380,
      derbies: 6,
    });
    expect(a.category).toBe("DERBY");
    expect(`${a.title} ${a.body}`).toContain("Real Divano");
    expect(`${a.title} ${a.body}`).toContain("AC Sciacallo");
    expect(a.body).toMatch(/3V 1N 2P/);
    expect(a.body).toContain("6 derby");
  });
});
