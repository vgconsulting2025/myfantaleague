import { NextResponse } from "next/server";
import { getLeagueRepository } from "@/lib/league/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface OpenBody {
  type?: string; // economica | premium
  free?: boolean; // bustina gratuita giornaliera
}

// POST /api/pack/open — apre una bustina (Economica/Premium o gratuita): assegna
// la carta di un giocatore casuale della lega a una rarità (con garanzia al 10°
// pack e conversione dei doppioni in rimborso).
export async function POST(request: Request) {
  const repo = getLeagueRepository();
  try {
    const { type, free } = (await request.json().catch(() => ({}))) as OpenBody;
    const result = await repo.openPack(type ?? "economica", !!free);
    await repo.completeChallenge("apri_bustina").catch(() => {});
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[/api/pack/open]", err);
    const message = err instanceof Error ? err.message : "Impossibile aprire la bustina.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
