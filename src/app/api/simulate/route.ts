import { NextResponse } from "next/server";
import { getLeagueRepository } from "@/lib/league/repository";
import type { LeagueTeam, MatchResult } from "@/lib/league/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function randScore(): number {
  // Punteggi fantacalcio plausibili tra 60 e 85, arrotondati al mezzo punto.
  return Math.round((60 + Math.random() * 25) * 2) / 2;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function topFm(team: LeagueTeam) {
  return [...team.players].sort((a, b) => b.fm - a.fm)[0];
}

function buildNote(home: LeagueTeam, away: LeagueTeam, hs: number, as: number): string {
  const winner = hs > as ? home : as > hs ? away : null;
  const loser = winner ? (winner === home ? away : home) : null;

  if (!winner || !loser) {
    return `Pareggio da manuale: ${topFm(home).name} e ${topFm(away).name} si annullano, la ${home.name} recrimina per un rigore.`;
  }

  const heroes = [
    `Trascinatore ${topFm(winner).name}`,
    `Show di ${topFm(winner).name}`,
    `${topFm(winner).name} on fire`,
    `Doppietta pesante di ${pick(winner.players.filter((p) => p.role === "A")).name}`,
  ];
  const flops = [
    `serataccia per ${pick(loser.players).name}`,
    `${pick(loser.players).name} da matita rossa`,
    `${pick(loser.players.filter((p) => p.role !== "P")).name} in bambola`,
  ];
  return `${pick(heroes)}, ${pick(flops)}.`;
}

// POST /api/simulate — "Simula giornata"
// Genera risultati plausibili tra le squadre della lega, aggiorna la classifica
// e crea una nuova giornata. Nessuna chiamata AI: serve a dimostrare il ciclo
// evento → notizia → mercato.
export async function POST() {
  const repo = getLeagueRepository();

  try {
    const teams = await repo.getTeams();
    if (teams.length < 2) {
      return NextResponse.json({ error: "Servono almeno 2 squadre." }, { status: 400 });
    }

    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    const results: MatchResult[] = [];
    const pointsByTeamName: Record<string, number> = {};
    const addPoints = (name: string, delta: number) => {
      pointsByTeamName[name] = (pointsByTeamName[name] ?? 0) + delta;
    };

    for (let i = 0; i + 1 < shuffled.length; i += 2) {
      const home = shuffled[i];
      const away = shuffled[i + 1];
      const hs = randScore();
      const as = randScore();
      results.push({
        home: home.name,
        away: away.name,
        homeScore: hs,
        awayScore: as,
        note: buildNote(home, away, hs, as),
      });

      if (hs > as) addPoints(home.name, 3);
      else if (as > hs) addPoints(away.name, 3);
      else {
        addPoints(home.name, 1);
        addPoints(away.name, 1);
      }
    }

    const giornata = await repo.recordGiornata(results, pointsByTeamName);
    return NextResponse.json({ giornata });
  } catch (err) {
    console.error("[/api/simulate]", err);
    return NextResponse.json(
      { error: "Impossibile simulare la giornata. Riprova." },
      { status: 500 },
    );
  }
}
