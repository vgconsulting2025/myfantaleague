import { describe, it, expect } from "vitest";
import {
  detectDelimiter,
  parseDelimited,
  normalizeRole,
  interpretRoster,
  interpretCalendar,
} from "./parse";

describe("parseDelimited / detectDelimiter", () => {
  it("rileva il delimitatore e gestisce le virgolette", () => {
    expect(detectDelimiter("a;b;c\n1;2;3")).toBe(";");
    expect(detectDelimiter("a\tb\tc")).toBe("\t");
    const rows = parseDelimited('nome,club\n"Rossi, jr",Inter');
    expect(rows).toEqual([
      ["nome", "club"],
      ["Rossi, jr", "Inter"],
    ]);
  });
});

describe("normalizeRole", () => {
  it("normalizza ruoli classici, estesi e Mantra", () => {
    expect(normalizeRole("P")).toBe("P");
    expect(normalizeRole("Por")).toBe("P");
    expect(normalizeRole("Attaccante")).toBe("A");
    expect(normalizeRole("dc")).toBe("D");
    expect(normalizeRole("xyz")).toBe("?");
  });
});

describe("interpretRoster", () => {
  it("mappa intestazioni tolleranti e normalizza ruoli/quotazioni", () => {
    const csv = [
      "Squadra;Giocatore;Ruolo;Club;Quotazione",
      "Real Divano;Sommer;Por;Inter;16",
      "Real Divano;Lautaro;Att;Inter;42",
      "AC Sciacallo;Maignan;P;Milan;17",
    ].join("\n");
    const preview = interpretRoster(parseDelimited(csv));
    expect(preview.players).toHaveLength(3);
    expect(preview.teams).toEqual(["Real Divano", "AC Sciacallo"]);
    const lautaro = preview.players.find((p) => p.name === "Lautaro")!;
    expect(lautaro.role).toBe("A");
    expect(lautaro.club).toBe("Inter");
    expect(lautaro.quota).toBe(42);
    expect(lautaro.team).toBe("Real Divano");
  });

  it("segnala i ruoli non riconosciuti come warning senza fallire", () => {
    const csv = ["squadra,giocatore,ruolo,club,quota", "Team A,Tizio,ZZZ,Inter,10"].join("\n");
    const preview = interpretRoster(parseDelimited(csv));
    expect(preview.players[0].role).toBe("?");
    expect(preview.warnings.some((w) => w.includes("ruolo non riconosciuto"))).toBe(true);
  });

  it("restituisce un errore chiaro se manca la colonna giocatore", () => {
    const csv = ["squadra,club,quota", "Team A,Inter,10"].join("\n");
    const preview = interpretRoster(parseDelimited(csv));
    expect(preview.players).toHaveLength(0);
    expect(preview.warnings[0]).toContain("giocatore");
  });
});

describe("interpretCalendar", () => {
  it("legge punteggi da colonne separate", () => {
    const csv = [
      "Giornata,Casa,Ospite,Punti casa,Punti ospite,Note",
      "6,Real Divano,AC Sciacallo,68.5,74,Bella gara",
    ].join("\n");
    const preview = interpretCalendar(parseDelimited(csv));
    expect(preview.results).toHaveLength(1);
    expect(preview.results[0]).toMatchObject({
      giornata: 6,
      home: "Real Divano",
      away: "AC Sciacallo",
      homeScore: 68.5,
      awayScore: 74,
      note: "Bella gara",
    });
  });

  it("legge punteggi da una colonna 'risultato' combinata", () => {
    const csv = ["giornata;casa;ospite;risultato", "3;Team A;Team B;71 - 70,5"].join("\n");
    const preview = interpretCalendar(parseDelimited(csv));
    expect(preview.results[0].homeScore).toBe(71);
    expect(preview.results[0].awayScore).toBe(70.5);
  });
});
