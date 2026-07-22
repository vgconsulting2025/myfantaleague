import { NextResponse } from "next/server";
import { getLeagueRepository } from "@/lib/league/repository";
import { outcomeFreeAgent } from "@/lib/league/news";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface DecideBody {
  id?: string;
  accepted?: boolean;
}

// POST /api/free-agents/decide — il presidente accetta o rifiuta una proposta
// dell'Agente su uno svincolato. Solo le proposte rivolte all'utente e ancora
// in sospeso sono decidibili. Se accettata, esegue lo scambio (il ceduto torna
// svincolato, lo svincolato entra in rosa) e genera l'articolo di esito.
export async function POST(request: Request) {
  const repo = getLeagueRepository();

  try {
    const body = (await request.json()) as DecideBody;
    const { id, accepted } = body;

    if (!id || typeof accepted !== "boolean") {
      return NextResponse.json({ error: "Dati proposta incompleti." }, { status: 400 });
    }

    const prop = await repo.getFreeAgentProposal(id);
    if (!prop || !prop.forUser || prop.status !== "pending") {
      return NextResponse.json(
        { error: "Proposta non trovata o già decisa." },
        { status: 409 },
      );
    }

    if (accepted) {
      try {
        await repo.executeFreeAgentSwap(prop.teamName, prop.giveName, prop.faName);
      } catch {
        return NextResponse.json(
          { error: "Scambio non più valido: la rosa è cambiata." },
          { status: 409 },
        );
      }
    }

    await repo.setFreeAgentProposalStatus(id, accepted ? "accepted" : "rejected");
    await repo.addNewsArticle(outcomeFreeAgent(prop.teamName, prop.giveName, prop.faName, accepted));
    await repo.pushFlashNews(
      accepted
        ? `UFFICIALE — ${prop.teamName} tessera lo svincolato ${prop.faName} e libera ${prop.giveName}.`
        : `${prop.teamName} rinuncia allo svincolato ${prop.faName}: rosa invariata.`,
      "mercato",
    );

    return NextResponse.json({ ok: true, status: accepted ? "accepted" : "rejected" });
  } catch (err) {
    console.error("[/api/free-agents/decide]", err);
    return NextResponse.json(
      { error: "Impossibile registrare la decisione. Riprova." },
      { status: 500 },
    );
  }
}
