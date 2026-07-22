import { NextResponse } from "next/server";
import { getLeagueRepository } from "@/lib/league/repository";
import type { FreeAgentInput } from "@/lib/league/repository";
import type { Role } from "@/lib/league/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROLES: Role[] = ["P", "D", "C", "A"];

interface FreeAgentBody {
  action?: "add" | "update" | "remove";
  id?: string;
  name?: string;
  role?: string;
  club?: string;
  quota?: number;
  fm?: number;
}

function fieldError(b: FreeAgentBody, partial: boolean): string | null {
  if (b.role !== undefined || !partial) {
    if (!ROLES.includes(b.role as Role)) return "Ruolo non valido (P/D/C/A).";
  }
  if (b.name !== undefined || !partial) {
    if (!b.name || String(b.name).trim().length < 2) return "Nome non valido.";
  }
  if (b.club !== undefined || !partial) {
    if (!b.club || String(b.club).trim().length < 2) return "Squadra di provenienza non valida.";
  }
  if (b.quota !== undefined || !partial) {
    const q = Number(b.quota);
    if (!Number.isInteger(q) || q < 1 || q > 500) return "Quota non valida (1-500).";
  }
  if (b.fm !== undefined || !partial) {
    const f = Number(b.fm);
    if (!Number.isFinite(f) || f < 0 || f > 20) return "Fantamedia non valida (0-20).";
  }
  return null;
}

// POST /api/free-agents — gestione (admin) dei giocatori svincolati: aggiunta,
// modifica e rimozione manuale dal pannello Configura.
export async function POST(request: Request) {
  const repo = getLeagueRepository();

  try {
    const body = (await request.json()) as FreeAgentBody;
    const action = body.action;

    if (action === "add") {
      const err = fieldError(body, false);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
      const input: FreeAgentInput = {
        name: String(body.name).trim(),
        role: body.role as Role,
        club: String(body.club).trim(),
        quota: Number(body.quota),
        fm: Number(body.fm),
      };
      await repo.addFreeAgent(input);
      return NextResponse.json({ ok: true });
    }

    if (action === "update") {
      if (!body.id) return NextResponse.json({ error: "Id mancante." }, { status: 400 });
      const err = fieldError(body, true);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
      const patch: Partial<FreeAgentInput> = {};
      if (body.name !== undefined) patch.name = String(body.name).trim();
      if (body.role !== undefined) patch.role = body.role as Role;
      if (body.club !== undefined) patch.club = String(body.club).trim();
      if (body.quota !== undefined) patch.quota = Number(body.quota);
      if (body.fm !== undefined) patch.fm = Number(body.fm);
      if (Object.keys(patch).length === 0) {
        return NextResponse.json({ error: "Nessuna modifica fornita." }, { status: 400 });
      }
      await repo.updateFreeAgent(body.id, patch);
      return NextResponse.json({ ok: true });
    }

    if (action === "remove") {
      if (!body.id) return NextResponse.json({ error: "Id mancante." }, { status: 400 });
      await repo.removeFreeAgent(body.id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Azione non riconosciuta." }, { status: 400 });
  } catch (err) {
    console.error("[/api/free-agents]", err);
    return NextResponse.json(
      { error: "Operazione sugli svincolati non riuscita. Riprova." },
      { status: 500 },
    );
  }
}
