// Costanti di stile condivise per l'interfaccia (portale di notizie).
import type { Role } from "@/lib/league/types";

export const ROLE_LABELS: Record<Role, string> = {
  P: "Portieri",
  D: "Difensori",
  C: "Centrocampisti",
  A: "Attaccanti",
};

export const ROLE_ORDER: Role[] = ["P", "D", "C", "A"];

// Colore del badge ruolo (P/D/C/A).
export const ROLE_BADGE: Record<Role, string> = {
  P: "bg-amber-500",
  D: "bg-verde",
  C: "bg-sky-600",
  A: "bg-rose-600",
};

// Stile "pill" per la categoria dell'articolo — tinte nella famiglia verde/oro.
export function categoryStyle(category: string): string {
  const key = category.trim().toUpperCase();
  const map: Record<string, string> = {
    CRONACA: "bg-verde-100 text-verde-700",
    PAGELLE: "bg-oro-100 text-oro-700",
    POLEMICHE: "bg-oro-200 text-oro-700",
    SPOGLIATOIO: "bg-verde-50 text-verde-600",
    MERCATO: "bg-verde-200 text-verde-900",
    SVINCOLATI: "bg-oro-200 text-oro-800",
    IDOLO: "bg-verde-700 text-white",
    PANCHINE: "bg-oro-50 text-oro-600",
  };
  return map[key] ?? "bg-verde-100 text-verde-700";
}
