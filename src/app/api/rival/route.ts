import { NextResponse } from "next/server";
import { getLeagueRepository } from "@/lib/league/repository";
import { canChangeRival } from "@/lib/league/rival";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RivalBody {
  teamId?: string;
}

// POST /api/rival — il presidente sceglie (o cambia) la squadra rivale storica.
// Vincolo anti-abuso: al massimo un cambio per giornata.
export async function POST(request: Request) {
  const repo = getLeagueRepository();

  try {
    const { teamId } = (await request.json()) as RivalBody;
    if (!teamId) {
      return NextResponse.json({ error: "Squadra non indicata." }, { status: 400 });
    }

    const teams = await repo.getTeams();
    const userTeam = teams.find((t) => t.isUser);
    if (!userTeam) {
      return NextResponse.json({ error: "Squadra utente non trovata." }, { status: 400 });
    }
    if (teamId === userTeam.id) {
      return NextResponse.json(
        { error: "Non puoi scegliere la tua squadra come rivale." },
        { status: 400 },
      );
    }
    const rival = teams.find((t) => t.id === teamId);
    if (!rival) {
      return NextResponse.json({ error: "Squadra non trovata." }, { status: 400 });
    }

    // Già rivale: nessun cambio.
    if (userTeam.rivalTeamId === teamId) {
      return NextResponse.json({ ok: true, unchanged: true });
    }

    const latest = await repo.getLatestGiornata();
    const latestNumber = latest?.number ?? 0;
    if (!canChangeRival(userTeam.rivalTeamId ?? null, userTeam.rivalSetGiornata ?? null, latestNumber)) {
      return NextResponse.json(
        {
          error:
            "Puoi cambiare rivale una sola volta a giornata. Simula una giornata per cambiarlo di nuovo.",
        },
        { status: 409 },
      );
    }

    await repo.setRival(teamId, latestNumber);
    await repo.pushFlashNews(
      `${userTeam.name} elegge ${rival.name} a rivale storico: è nata una rivalità.`,
      "derby",
    );

    return NextResponse.json({ ok: true, status: "set" });
  } catch (err) {
    console.error("[/api/rival]", err);
    return NextResponse.json({ error: "Impossibile scegliere il rivale. Riprova." }, { status: 500 });
  }
}
