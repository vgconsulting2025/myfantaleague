import { NextResponse } from "next/server";
import { getLeagueRepository } from "@/lib/league/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/import/reset — ripristina la lega dimostrativa del seed.
export async function POST() {
  try {
    await getLeagueRepository().resetToDemo();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/import/reset]", err);
    return NextResponse.json({ error: "Ripristino non riuscito. Riprova." }, { status: 500 });
  }
}
