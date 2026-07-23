import { NextResponse } from "next/server";
import { getLeagueRepository } from "@/lib/league/repository";
import { canChangeIdol } from "@/lib/league/idol";
import { announceIdol } from "@/lib/league/news";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface IdolBody {
  playerId?: string;
}

// POST /api/idol — il presidente designa (o cambia) l'idolo della propria rosa.
// Vincolo anti-abuso: al massimo un cambio per giornata. Alla designazione crea
// un articolo goliardico + una notizia flash.
export async function POST(request: Request) {
  const repo = getLeagueRepository();

  try {
    const { playerId } = (await request.json()) as IdolBody;
    if (!playerId) {
      return NextResponse.json({ error: "Giocatore non indicato." }, { status: 400 });
    }

    const userTeam = await repo.getUserTeam();
    const player = userTeam.players.find((p) => p.id === playerId);
    if (!player) {
      return NextResponse.json(
        { error: "Puoi designare come idolo solo un giocatore della tua rosa." },
        { status: 400 },
      );
    }

    // Già idolo: nessun cambio (idempotente, nessun articolo).
    if (userTeam.idolPlayerId === playerId) {
      return NextResponse.json({ ok: true, unchanged: true });
    }

    const latest = await repo.getLatestGiornata();
    const latestNumber = latest?.number ?? 0;
    if (!canChangeIdol(userTeam.idolPlayerId ?? null, userTeam.idolSetGiornata ?? null, latestNumber)) {
      return NextResponse.json(
        {
          error:
            "Puoi cambiare idolo una sola volta a giornata. Simula una giornata per poterlo cambiare di nuovo.",
        },
        { status: 409 },
      );
    }

    await repo.setIdol(playerId, latestNumber);
    await repo.addNewsArticle(announceIdol(userTeam.name, player.name));
    await repo.pushFlashNews(
      `Nuovo idolo: ${player.name} è l'eroe designato del ${userTeam.name}.`,
      "idolo",
    );

    return NextResponse.json({ ok: true, status: "set" });
  } catch (err) {
    console.error("[/api/idol]", err);
    return NextResponse.json(
      { error: "Impossibile designare l'idolo. Riprova." },
      { status: 500 },
    );
  }
}
