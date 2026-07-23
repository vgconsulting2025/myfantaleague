import { NextResponse } from "next/server";
import { getLeagueRepository } from "@/lib/league/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/pack/open — apre una bustina: spende Fanta Coins e assegna una skin
// cosmetica casuale (pesata per rarità).
export async function POST() {
  const repo = getLeagueRepository();
  try {
    const result = await repo.openPack();
    await repo.completeChallenge("apri_bustina").catch(() => {});
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[/api/pack/open]", err);
    const message = err instanceof Error ? err.message : "Impossibile aprire la bustina.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
