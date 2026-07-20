import { describe, it, expect } from "vitest";
import { getClubColors } from "./clubColors";

describe("getClubColors", () => {
  it("riconosce i club noti in modo case-insensitive", () => {
    expect(getClubColors("Inter")).toEqual(getClubColors("inter"));
    expect(getClubColors("JUVENTUS").primary).toBe(getClubColors("Juventus").primary);
  });

  it("gestisce match parziali (es. 'AC Milan' → milan)", () => {
    expect(getClubColors("AC Milan")).toEqual(getClubColors("Milan"));
  });

  it("mappa Hellas Verona e Verona allo stesso colore", () => {
    expect(getClubColors("Hellas Verona")).toEqual(getClubColors("Verona"));
  });

  it("usa un fallback neutro per club sconosciuti o vuoti", () => {
    const fallback = getClubColors("Squadra Inventata FC");
    expect(fallback.primary).toBeTruthy();
    expect(getClubColors(null)).toEqual(fallback);
    expect(getClubColors("")).toEqual(fallback);
  });
});
