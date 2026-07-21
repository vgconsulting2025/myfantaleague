import { NextResponse } from "next/server";
import { getLeagueRepository } from "@/lib/league/repository";
import { isValidHexColor } from "@/lib/league/identity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/team/colors — imposta i colori sociali della propria squadra
// ({ reset: true } torna ai colori di default dell'app).
export async function POST(request: Request) {
  const repo = getLeagueRepository();
  try {
    const body = await request.json();
    if (body?.reset) {
      await repo.setUserTeamColors(null, null);
      return NextResponse.json({ ok: true });
    }
    const color1 = String(body?.color1 ?? "");
    const color2 = body?.color2 ? String(body.color2) : null;
    if (!isValidHexColor(color1)) {
      return NextResponse.json({ error: "Colore principale non valido." }, { status: 400 });
    }
    if (color2 && !isValidHexColor(color2)) {
      return NextResponse.json({ error: "Colore secondario non valido." }, { status: 400 });
    }
    await repo.setUserTeamColors(color1, color2);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/team/colors]", err);
    return NextResponse.json({ error: "Impossibile salvare i colori." }, { status: 500 });
  }
}
