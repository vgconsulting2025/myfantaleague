import { NextResponse } from "next/server";
import { getLeagueRepository } from "@/lib/league/repository";
import type { LeagueConfig } from "@/lib/league/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ConfigBody {
  gazzettaName?: string;
  freeAgentEnabled?: boolean;
  freeAgentMaxPerWeek?: number;
  acquistoCoinsAbilitato?: boolean;
}

// POST /api/config — aggiornamento (admin) della configurazione lega:
// nome della Gazzetta, abilitazione e tetto settimanale delle proposte svincolati.
export async function POST(request: Request) {
  const repo = getLeagueRepository();

  try {
    const body = (await request.json()) as ConfigBody;
    const patch: Partial<LeagueConfig> = {};

    if (body.gazzettaName !== undefined) {
      const name = String(body.gazzettaName).trim();
      if (name.length < 2 || name.length > 40) {
        return NextResponse.json(
          { error: "Il nome della Gazzetta deve avere da 2 a 40 caratteri." },
          { status: 400 },
        );
      }
      patch.gazzettaName = name;
    }

    if (body.freeAgentEnabled !== undefined) {
      if (typeof body.freeAgentEnabled !== "boolean") {
        return NextResponse.json({ error: "Valore non valido." }, { status: 400 });
      }
      patch.freeAgentEnabled = body.freeAgentEnabled;
    }

    if (body.freeAgentMaxPerWeek !== undefined) {
      const n = Number(body.freeAgentMaxPerWeek);
      if (!Number.isInteger(n) || n < 0 || n > 10) {
        return NextResponse.json(
          { error: "Il numero massimo di proposte deve essere tra 0 e 10." },
          { status: 400 },
        );
      }
      patch.freeAgentMaxPerWeek = n;
    }

    if (body.acquistoCoinsAbilitato !== undefined) {
      if (typeof body.acquistoCoinsAbilitato !== "boolean") {
        return NextResponse.json({ error: "Valore non valido." }, { status: 400 });
      }
      patch.acquistoCoinsAbilitato = body.acquistoCoinsAbilitato;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Nessuna modifica fornita." }, { status: 400 });
    }

    const config = await repo.updateConfig(patch);
    return NextResponse.json({ ok: true, config });
  } catch (err) {
    console.error("[/api/config]", err);
    return NextResponse.json(
      { error: "Impossibile salvare la configurazione. Riprova." },
      { status: 500 },
    );
  }
}
