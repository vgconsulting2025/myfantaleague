import { describe, it, expect } from "vitest";
import {
  resolveTeamColors,
  defaultJerseyNumber,
  displayNumber,
  resolvePlayerImage,
  isValidHexColor,
  APP_COLORS,
} from "./identity";
import type { LeaguePlayer, Role, TeamIdentity } from "./types";

function ident(partial: Partial<TeamIdentity>): TeamIdentity {
  return {
    name: "Team",
    crestUrl: null,
    jerseyFrontUrl: null,
    jerseyBackUrl: null,
    color1: null,
    color2: null,
    ...partial,
  };
}

function player(p: Partial<LeaguePlayer> & { name: string }): LeaguePlayer {
  return { id: p.name, role: "A" as Role, club: "Inter", quota: 20, fm: 6, ...p };
}

describe("resolveTeamColors", () => {
  it("usa i colori dell'app se non ci sono colori sociali", () => {
    expect(resolveTeamColors(null)).toEqual({
      primary: APP_COLORS.primary,
      secondary: APP_COLORS.secondary,
    });
  });
  it("usa un solo colore sociale come primario e secondario", () => {
    expect(resolveTeamColors(ident({ color1: "#123456" }))).toEqual({
      primary: "#123456",
      secondary: "#123456",
    });
  });
  it("usa entrambi i colori sociali", () => {
    expect(resolveTeamColors(ident({ color1: "#111111", color2: "#eeeeee" }))).toEqual({
      primary: "#111111",
      secondary: "#eeeeee",
    });
  });
});

describe("numero di maglia", () => {
  it("default deterministico 1-99", () => {
    const a = defaultJerseyNumber("Lautaro");
    expect(a).toBe(defaultJerseyNumber("Lautaro"));
    expect(a).toBeGreaterThanOrEqual(1);
    expect(a).toBeLessThanOrEqual(99);
  });
  it("displayNumber usa il numero impostato o il default", () => {
    expect(displayNumber(player({ name: "X", number: 10 }))).toBe(10);
    expect(displayNumber(player({ name: "X", number: null }))).toBe(defaultJerseyNumber("X"));
    expect(displayNumber(player({ name: "X", number: 200 }))).toBe(defaultJerseyNumber("X"));
  });
});

describe("resolvePlayerImage (priorità)", () => {
  it("la foto del giocatore ha priorità e resta invariata (src === imageUrl)", () => {
    const p = player({
      name: "Lautaro",
      fm: 7.4,
      imageUrl: "/uploads/players/abc.png",
      owner: ident({ jerseyFrontUrl: "/uploads/teams/j.png" }),
    });
    const r = resolvePlayerImage(p);
    expect(r.mode).toBe("photo");
    expect(r.src).toBe("/uploads/players/abc.png"); // nessuna alterazione
    expect(r.rare).toBe(true); // fm >= 7
  });
  it("senza foto usa la maglia della squadra (fronte)", () => {
    const r = resolvePlayerImage(
      player({ name: "X", owner: ident({ jerseyFrontUrl: "/uploads/teams/j.png" }) }),
    );
    expect(r.mode).toBe("jerseyFront");
    expect(r.src).toBe("/uploads/teams/j.png");
  });
  it("senza foto né maglia usa la maglia generata", () => {
    const r = resolvePlayerImage(player({ name: "X" }));
    expect(r.mode).toBe("generated");
    expect(r.src).toBeNull();
    expect(r.rare).toBe(false);
  });
});

describe("isValidHexColor", () => {
  it("valida esadecimali a 6 cifre", () => {
    expect(isValidHexColor("#123D28")).toBe(true);
    expect(isValidHexColor("#fff")).toBe(false);
    expect(isValidHexColor("red")).toBe(false);
  });
});
