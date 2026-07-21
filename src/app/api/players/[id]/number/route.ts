import { NextResponse } from "next/server";
import { getLeagueRepository } from "@/lib/league/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/players/:id/number — imposta il numero di maglia (1-99) di un
// giocatore della propria rosa.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const repo = getLeagueRepository();
  try {
    const { id } = await params;
    const found = await repo.getPlayerById(id);
    if (!found) return NextResponse.json({ error: "Giocatore non trovato." }, { status: 404 });
    if (!found.isUser) {
      return NextResponse.json({ error: "Operazione consentita solo sulla tua rosa." }, { status: 403 });
    }
    const body = await request.json();
    const n = Math.round(Number(body?.number));
    if (!Number.isInteger(n) || n < 1 || n > 99) {
      return NextResponse.json({ error: "Il numero deve essere tra 1 e 99." }, { status: 400 });
    }
    await repo.setPlayerNumber(id, n);
    return NextResponse.json({ ok: true, number: n });
  } catch (err) {
    console.error("[/api/players/:id/number]", err);
    return NextResponse.json({ error: "Salvataggio non riuscito." }, { status: 500 });
  }
}
