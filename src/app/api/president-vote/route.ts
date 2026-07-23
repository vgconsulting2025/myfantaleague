import { NextResponse } from "next/server";
import { getLeagueRepository } from "@/lib/league/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/president-vote — l'utente (il suo presidente) vota un altro presidente.
export async function POST(request: Request) {
  const repo = getLeagueRepository();
  try {
    const body = await request.json();
    const toTeam = String(body?.toTeam ?? "");
    const score = Math.round(Number(body?.score));
    const comment = String(body?.comment ?? "").slice(0, 140);

    const user = await repo.getUserTeam();
    const res = await repo.addPeerVote(user.name, toTeam, score, comment);
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
    // Sfida: vota un allenatore.
    await repo.completeChallenge("vota_allenatore").catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/president-vote]", err);
    return NextResponse.json({ error: "Voto non registrato. Riprova." }, { status: 500 });
  }
}
