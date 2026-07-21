// Validazione PURA delle immagini caricate per i giocatori (formato + dimensione).
// Le immagini vengono salvate come file statici (vedi /api/players/[id]/image),
// mai in base64 nel DB.

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export function extForMime(mime: string): string | null {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    default:
      return null;
  }
}

export interface ImageValidation {
  ok: boolean;
  error?: string;
}

export function validatePlayerImage(mimeType: string, size: number): ImageValidation {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(mimeType)) {
    return { ok: false, error: "Formato non valido: usa PNG, JPG o WebP." };
  }
  if (size <= 0) return { ok: false, error: "File vuoto." };
  if (size > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      error: `Immagine troppo grande (max ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MB).`,
    };
  }
  return { ok: true };
}
