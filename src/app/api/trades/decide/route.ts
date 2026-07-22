import { NextResponse } from "next/server";
import { getLeagueRepository } from "@/lib/league/repository";
import { outcomeSquadTrade } from "@/lib/league/news";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface DecideBody {
  otherTeam?: string;
  give?: string;
  receive?: string;
  rationale?: string;
  agentComment?: string;
  accepted?: boolean;
}

// POST /api/trades/decide — accetta o rifiuta una proposta.
// Se accettata: esegue lo scambio nel DB (i giocatori cambiano rosa), registra
// lo scambio e genera una notizia flash. Se rifiutata: registra e genera
// comunque una notizia di mercato saltato.
export async function POST(request: Request) {
  const repo = getLeagueRepository();

  try {
    const body = (await request.json()) as DecideBody;
    const { otherTeam, give, receive, rationale = "", agentComment = "", accepted } = body;

    if (!otherTeam || !give || !receive || typeof accepted !== "boolean") {
      return NextResponse.json({ error: "Dati proposta incompleti." }, { status: 400 });
    }

    // Ri-validazione lato server: lo scambio deve essere ancora possibile.
    const teams = await repo.getTeams();
    const userTeam = teams.find((t) => t.isUser);
    const other = teams.find((t) => t.name === otherTeam);
    if (!userTeam || !other) {
      return NextResponse.json({ error: "Squadra non trovata." }, { status: 400 });
    }
    const giveOk = userTeam.players.some((p) => p.name === give);
    const receiveOk = other.players.some((p) => p.name === receive);
    if (!giveOk || !receiveOk) {
      return NextResponse.json(
        { error: "Scambio non più valido: le rose sono cambiate." },
        { status: 409 },
      );
    }

    if (accepted) {
      await repo.executeTradeSwap(userTeam.name, other.name, give, receive);
      await repo.recordTrade({
        status: "accepted",
        fromTeam: userTeam.name,
        toTeam: other.name,
        giveName: give,
        receiveName: receive,
        rationale,
        agentComment,
      });
      await repo.pushFlashNews(
        `UFFICIALE — ${userTeam.name} cede ${give} a ${other.name} e accoglie ${receive}. L'Agente incassa la commissione.`,
        "mercato",
      );
    } else {
      await repo.recordTrade({
        status: "rejected",
        fromTeam: userTeam.name,
        toTeam: other.name,
        giveName: give,
        receiveName: receive,
        rationale,
        agentComment,
      });
      await repo.pushFlashNews(
        `Saltato lo scambio ${give} ↔ ${receive}: il presidente di ${userTeam.name} ha detto no a ${other.name}.`,
        "mercato",
      );
    }

    // Articolo di esito sulla Gazzetta.
    await repo.addNewsArticle(outcomeSquadTrade(userTeam.name, other.name, give, receive, accepted));

    return NextResponse.json({ ok: true, status: accepted ? "accepted" : "rejected" });
  } catch (err) {
    console.error("[/api/trades/decide]", err);
    return NextResponse.json(
      { error: "Impossibile registrare la decisione. Riprova." },
      { status: 500 },
    );
  }
}
