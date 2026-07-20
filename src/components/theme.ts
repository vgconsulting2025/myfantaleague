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
  D: "bg-emerald-600",
  C: "bg-sky-600",
  A: "bg-rose-600",
};

// Stile "pill" per la categoria dell'articolo.
export function categoryStyle(category: string): string {
  const key = category.trim().toUpperCase();
  const map: Record<string, string> = {
    CRONACA: "bg-emerald-100 text-emerald-800",
    PAGELLE: "bg-sky-100 text-sky-800",
    POLEMICHE: "bg-rose-100 text-rose-800",
    SPOGLIATOIO: "bg-amber-100 text-amber-800",
    MERCATO: "bg-indigo-100 text-indigo-800",
  };
  return map[key] ?? "bg-slate-100 text-slate-700";
}
