import { NextResponse } from "next/server";
import { getLeagueRepository } from "@/lib/league/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ApplyBody {
  playerId?: string;
  rarity?: string | null;
}

// POST /api/skin/apply — applica (o rimuove) lo stile di una carta posseduta alla
// figurina reale di un giocatore in rosa (non-idolo). rarity null = rimuove.
export async function POST(request: Request) {
  const repo = getLeagueRepository();
  try {
    const { playerId, rarity } = (await request.json()) as ApplyBody;
    if (!playerId) {
      return NextResponse.json({ error: "Giocatore non indicato." }, { status: 400 });
    }
    await repo.applyCard(playerId, rarity ?? null);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/skin/apply]", err);
    const message = err instanceof Error ? err.message : "Impossibile applicare la skin.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
