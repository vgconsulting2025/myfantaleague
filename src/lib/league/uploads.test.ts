import { describe, it, expect } from "vitest";
import { validatePlayerImage, extForMime, MAX_IMAGE_BYTES } from "./uploads";

describe("validatePlayerImage", () => {
  it("accetta PNG/JPG/WebP entro il limite", () => {
    expect(validatePlayerImage("image/png", 1000).ok).toBe(true);
    expect(validatePlayerImage("image/jpeg", 1000).ok).toBe(true);
    expect(validatePlayerImage("image/webp", 1000).ok).toBe(true);
  });

  it("rifiuta formati non consentiti", () => {
    const r = validatePlayerImage("image/gif", 1000);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Formato/);
  });

  it("rifiuta file vuoti o troppo grandi", () => {
    expect(validatePlayerImage("image/png", 0).ok).toBe(false);
    expect(validatePlayerImage("image/png", MAX_IMAGE_BYTES + 1).ok).toBe(false);
    expect(validatePlayerImage("image/png", MAX_IMAGE_BYTES).ok).toBe(true);
  });
});

describe("extForMime", () => {
  it("mappa i mime alle estensioni corrette", () => {
    expect(extForMime("image/png")).toBe("png");
    expect(extForMime("image/jpeg")).toBe("jpg");
    expect(extForMime("image/webp")).toBe("webp");
    expect(extForMime("image/gif")).toBeNull();
  });
});
