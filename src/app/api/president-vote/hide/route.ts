import { NextResponse } from "next/server";
import { getLeagueRepository } from "@/lib/league/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/president-vote/hide — l'admin di lega rimuove un commento dalla bacheca.
export async function POST(request: Request) {
  const repo = getLeagueRepository();
  try {
    const body = await request.json();
    const id = String(body?.id ?? "");
    if (!id) return NextResponse.json({ error: "ID mancante." }, { status: 400 });
    await repo.hidePeerVote(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/president-vote/hide]", err);
    return NextResponse.json({ error: "Rimozione non riuscita." }, { status: 500 });
  }
}
