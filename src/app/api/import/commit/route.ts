import { NextResponse } from "next/server";
import { getLeagueRepository, type ImportTeamData } from "@/lib/league/repository";
import type { ImportPlayerRow, ImportResultRow, ImportMode } from "@/lib/league/import/types";
import type { Role } from "@/lib/league/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CommitBody {
  kind?: "roster" | "calendar";
  mode?: ImportMode;
  myTeam?: string | null;
  players?: ImportPlayerRow[];
  results?: ImportResultRow[];
}

const VALID_ROLES: Role[] = ["P", "D", "C", "A"];

// POST /api/import/commit — scrive i dati (già validati/corretti in anteprima)
// nel DB. Roster: mode "replace" (sostituisce la lega) o "merge" (aggiorna).
// Calendar: sostituisce le giornate e ricalcola i punti.
export async function POST(request: Request) {
  const repo = getLeagueRepository();
  try {
    const body = (await request.json()) as CommitBody;

    if (body.kind === "roster") {
      const players = body.players ?? [];
      if (!players.length) {
        return NextResponse.json({ error: "Nessun giocatore da importare." }, { status: 400 });
      }
      const bad = players.find((p) => !VALID_ROLES.includes(p.role as Role));
      if (bad) {
        return NextResponse.json(
          { error: `Ruolo non valido per "${bad.name}" ("${bad.role}"). Correggilo nell'anteprima (P/D/C/A).` },
          { status: 400 },
        );
      }

      const grouped = new Map<string, ImportTeamData>();
      for (const p of players) {
        const teamName = (p.team || "").trim() || "Senza squadra";
        if (!grouped.has(teamName)) grouped.set(teamName, { name: teamName, players: [] });
        grouped.get(teamName)!.players.push({
          name: String(p.name).trim(),
          role: p.role as Role,
          club: String(p.club || "").trim(),
          quota: Math.round(Number(p.quota)) || 0,
          fm: Number.isFinite(Number(p.fm)) ? Number(p.fm) : 6,
        });
      }
      const teams = [...grouped.values()].filter((t) => t.players.length > 0);
      if (!teams.length) {
        return NextResponse.json({ error: "Nessuna squadra riconosciuta." }, { status: 400 });
      }

      const mode: ImportMode = body.mode === "merge" ? "merge" : "replace";
      const myTeam = body.myTeam ? String(body.myTeam) : null;
      if (mode === "merge") await repo.mergeRoster(teams, myTeam);
      else await repo.replaceLeague(teams, myTeam);

      return NextResponse.json({
        ok: true,
        mode,
        teams: teams.length,
        players: players.length,
      });
    }

    if (body.kind === "calendar") {
      const results = body.results ?? [];
      const clean: ImportResultRow[] = results
        .map((r) => ({
          giornata: Math.round(Number(r.giornata)) || 1,
          home: String(r.home || "").trim(),
          away: String(r.away || "").trim(),
          homeScore: Number.isFinite(Number(r.homeScore)) ? Number(r.homeScore) : 0,
          awayScore: Number.isFinite(Number(r.awayScore)) ? Number(r.awayScore) : 0,
          note: String(r.note || ""),
        }))
        .filter((r) => r.home && r.away);
      if (!clean.length) {
        return NextResponse.json({ error: "Nessuna partita valida da importare." }, { status: 400 });
      }
      await repo.importResults(clean);
      return NextResponse.json({ ok: true, results: clean.length });
    }

    return NextResponse.json({ error: "Tipo di import non valido." }, { status: 400 });
  } catch (err) {
    console.error("[/api/import/commit]", err);
    return NextResponse.json({ error: "Import non riuscito. Riprova." }, { status: 500 });
  }
}
