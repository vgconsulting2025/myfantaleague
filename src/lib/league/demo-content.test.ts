import { describe, it, expect } from "vitest";
import { generateDemoArticles, generateDemoProposals } from "./demo-content";
import { validateProposals } from "./trades";
import type { Giornata, LeagueTeam, LeaguePlayer, Role } from "./types";

function player(name: string, role: Role): LeaguePlayer {
  return { id: name, name, role, club: `${name} FC`, quota: 20, fm: 6.5 };
}

function team(name: string, isUser: boolean, points: number): LeagueTeam {
  return {
    id: name,
    slug: name.toLowerCase().replace(/\s/g, "-"),
    name,
    president: `Presidente ${name}`,
    points,
    isUser,
    players: [
      player(`${name}-Por`, "P"),
      player(`${name}-Dif`, "D"),
      player(`${name}-Cen`, "C"),
      player(`${name}-Att`, "A"),
    ],
  };
}

const userTeam = team("Real Divano", true, 12);
const other1 = team("AC Sciacallo", false, 15);
const other2 = team("Bayern Monaci", false, 8);
const others = [other1, other2];
const standings = [other1, userTeam, other2]; // ordinata per punti desc

describe("modalità demo — generateDemoProposals (fallback senza AI)", () => {
  it("genera 3 proposte, tutte valide sui dati reali e con ruoli coerenti", () => {
    const raw = generateDemoProposals(userTeam, others);
    expect(raw).toHaveLength(3);

    // Passano la stessa validazione usata per le proposte AI.
    const valid = validateProposals(raw, userTeam, others);
    expect(valid).toHaveLength(3);

    for (const p of valid) {
      expect(p.givePlayer).not.toBeNull();
      expect(p.receivePlayer).not.toBeNull();
      // Il ceduto è dell'utente, il ricevuto della squadra indicata, stesso ruolo.
      expect(userTeam.players.some((pl) => pl.name === p.give)).toBe(true);
      expect(p.givePlayer!.role).toBe(p.receivePlayer!.role);
      expect(p.rationale.trim().length).toBeGreaterThan(0);
      expect(p.agentComment.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("modalità demo — generateDemoArticles (fallback senza AI)", () => {
  const latest: Giornata = {
    number: 3,
    playedAt: new Date().toISOString(),
    results: [
      {
        home: "Real Divano",
        away: "AC Sciacallo",
        homeScore: 78,
        awayScore: 61,
        note: "Gara a senso unico.",
      },
    ],
  };

  it("genera 4-6 articoli con titoli/testi non vuoti e dati reali della lega", () => {
    const articles = generateDemoArticles({ standings, latest, trades: [] });
    expect(articles.length).toBeGreaterThanOrEqual(4);
    expect(articles.length).toBeLessThanOrEqual(6);

    for (const a of articles) {
      expect(a.title.trim().length).toBeGreaterThan(0);
      expect(a.body.trim().length).toBeGreaterThan(0);
      expect(a.category.trim().length).toBeGreaterThan(0);
    }

    // Almeno un articolo cita una squadra reale della lega.
    const joined = articles.map((a) => `${a.title} ${a.body}`).join(" ");
    expect(/Real Divano|AC Sciacallo|Bayern Monaci/.test(joined)).toBe(true);
  });

  it("funziona anche senza giornate giocate", () => {
    const articles = generateDemoArticles({ standings, latest: null, trades: [] });
    expect(articles.length).toBeGreaterThanOrEqual(4);
  });
});
