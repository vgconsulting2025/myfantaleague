import { NextResponse } from "next/server";
import { getLeagueRepository } from "@/lib/league/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface BuyBody {
  pack?: string;
}

// POST /api/coins/buy — acquisto Fanta Coins con denaro reale. Dietro feature
// flag: se ACQUISTO_COINS_ABILITATO è disattivato (default), risponde che la
// funzionalità non è ancora attiva. Nessun gestore di pagamenti reale integrato.
export async function POST(request: Request) {
  const repo = getLeagueRepository();
  try {
    const config = await repo.getConfig();
    if (!config.acquistoCoinsAbilitato) {
      return NextResponse.json(
        { error: "Funzionalità non ancora attiva.", enabled: false },
        { status: 403 },
      );
    }
    const { pack } = (await request.json()) as BuyBody;
    if (!pack) {
      return NextResponse.json({ error: "Pacchetto non indicato." }, { status: 400 });
    }
    const result = await repo.buyCoins(pack);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[/api/coins/buy]", err);
    const message = err instanceof Error ? err.message : "Acquisto non riuscito.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
