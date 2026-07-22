import { NextResponse } from "next/server";
import { getLeagueRepository } from "@/lib/league/repository";
import type {
  PerformanceInput,
  CoachRatingInput,
  NewFreeAgentProposal,
  LeagueRepository,
} from "@/lib/league/repository";
import type { ArticleInput, LeagueTeam, MatchResult } from "@/lib/league/types";
import { hasAnthropicKey, askClaude, parseAiJson } from "@/lib/anthropic";
import {
  generateDemoCoachRatings,
  generateSimulatedPeerVotes,
} from "@/lib/league/demo-content";
import {
  pickFreeAgentMatch,
  freeAgentRationale,
  freeAgentComment,
} from "@/lib/league/freeagents";
import { announceFreeAgent, outcomeFreeAgent } from "@/lib/league/news";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function genFanta(): { vote: number; bonus: number } {
  const base = 4.5 + Math.random() * 3.5; // 4.5 - 8.0
  let bonus = 0;
  const r = Math.random();
  if (r < 0.12) bonus += 3; // gol
  else if (r < 0.26) bonus += 1; // assist
  if (Math.random() < 0.07) bonus -= 1; // ammonizione
  return { vote: Math.round(base * 2) / 2, bonus };
}

// Genera i voti dei giocatori e la formazione scelta dall'"allenatore":
// i titolari sono scelti per fantamedia + rumore, così ogni tanto un gioiello
// resta in panchina o un titolare flop entra in campo (materiale per i voti).
function generateTeamPerformances(team: LeagueTeam): PerformanceInput[] {
  const withVotes = team.players.map((p) => ({ p, ...genFanta() }));
  const scored = withVotes.map((x) => ({ ...x, coach: x.p.fm + (Math.random() - 0.5) * 2.6 }));

  const starters = new Set<string>();
  const keepers = scored.filter((x) => x.p.role === "P").sort((a, b) => b.coach - a.coach);
  if (keepers[0]) starters.add(keepers[0].p.name);
  const others = scored.filter((x) => x.p.role !== "P").sort((a, b) => b.coach - a.coach);
  for (let i = 0; i < 10 && i < others.length; i++) starters.add(others[i].p.name);

  return withVotes.map((x) => ({
    teamName: team.name,
    president: team.president,
    playerName: x.p.name,
    role: x.p.role,
    vote: x.vote,
    bonus: x.bonus,
    fielded: starters.has(x.p.name),
  }));
}

const fv = (p: PerformanceInput) => p.vote + p.bonus;

function buildNote(
  home: LeagueTeam,
  away: LeagueTeam,
  perfByTeam: Map<string, PerformanceInput[]>,
  hs: number,
  as: number,
): string {
  const bestOf = (name: string) =>
    (perfByTeam.get(name) ?? []).filter((p) => p.fielded).sort((a, b) => fv(b) - fv(a))[0];
  const worstOf = (name: string) =>
    (perfByTeam.get(name) ?? []).filter((p) => p.fielded).sort((a, b) => fv(a) - fv(b))[0];

  const winner = hs > as ? home : as > hs ? away : null;
  if (!winner) {
    const b = bestOf(home.name);
    return `Pari e spettacolo: ${b ? `${b.playerName} (${fv(b).toFixed(1)})` : "nessuno"} il migliore in campo.`;
  }
  const loser = winner === home ? away : home;
  const hero = bestOf(winner.name);
  const flop = worstOf(loser.name);
  return `${hero ? `Trascinatore ${hero.playerName} (${fv(hero).toFixed(1)})` : "Vittoria di squadra"}, ${
    flop ? `in ombra ${flop.playerName} (${fv(flop).toFixed(1)})` : "avversari opachi"
  }.`;
}

async function aiCoachRatings(
  perfByTeam: Map<string, PerformanceInput[]>,
  teams: LeagueTeam[],
): Promise<CoachRatingInput[]> {
  const blocks = teams
    .map((t) => {
      const perfs = perfByTeam.get(t.name) ?? [];
      const label = t.president && t.president !== "—" ? t.president : t.name;
      const line = (list: PerformanceInput[]) =>
        list.map((p) => `${p.playerName} ${fv(p).toFixed(1)}`).join(", ");
      return `SQUADRA "${t.name}" (presidente ${label})\n  TITOLARI: ${line(
        perfs.filter((p) => p.fielded),
      )}\n  PANCHINA: ${line(perfs.filter((p) => !p.fielded))}`;
    })
    .join("\n");

  const prompt = `Sei un opinionista di fantacalcio pungente e goliardico. Per ogni squadra dai un voto da 1 a 10 all'allenatore (il presidente) in base alle SCELTE DI FORMAZIONE: penalizza chi ha lasciato in panchina giocatori con fantavoto alto e chi ha schierato titolari flop; premia le scelte azzeccate. Commento sarcastico, max 20 parole.

${blocks}

Rispondi SOLO con JSON valido, nessun altro testo:
[{"teamName":"nome esatto squadra","score":numero intero 1-10,"comment":"commento goliardico"}]`;

  const parsed = parseAiJson<unknown>(await askClaude(prompt, 1500));
  if (!Array.isArray(parsed)) throw new Error("Formato voti non valido");
  const presByTeam = new Map(teams.map((t) => [t.name, t.president]));
  const out: CoachRatingInput[] = [];
  for (const r of parsed) {
    if (!r || typeof r !== "object") continue;
    const teamName = String((r as Record<string, unknown>).teamName ?? "");
    if (!presByTeam.has(teamName)) continue;
    const raw = Math.round(Number((r as Record<string, unknown>).score));
    if (!Number.isFinite(raw)) continue;
    out.push({
      teamName,
      president: presByTeam.get(teamName)!,
      score: Math.max(1, Math.min(10, raw)),
      comment: String((r as Record<string, unknown>).comment ?? "").slice(0, 200),
    });
  }
  if (!out.length) throw new Error("Nessun voto valido");
  return out;
}

// Canale svincolati: a ogni giornata l'Agente propone in autonomia, con cadenza
// casuale (0..maxPerWeek), scambi 1-per-1 tra un giocatore di una squadra e uno
// svincolato compatibile. Per le squadre AI decide da sé (ed esegue lo scambio);
// per la squadra dell'utente lascia una proposta in sospeso (badge sul Mercato).
// Ogni proposta genera un articolo di annuncio; ogni esito AI un secondo articolo.
async function generateFreeAgentProposals(
  repo: LeagueRepository,
  teams: LeagueTeam[],
): Promise<void> {
  const config = await repo.getConfig();
  if (!config.freeAgentEnabled) return;

  const freeAgents = await repo.getFreeAgents();
  if (freeAgents.length === 0) return;

  const count = Math.floor(Math.random() * (config.freeAgentMaxPerWeek + 1));
  if (count === 0) return;

  const usedFa = new Set<string>();
  const usedGive = new Set<string>();
  const proposals: NewFreeAgentProposal[] = [];
  const articles: ArticleInput[] = [];

  for (let k = 0; k < count; k++) {
    const team = teams[Math.floor(Math.random() * teams.length)];
    const availableFa = freeAgents.filter((fa) => !usedFa.has(fa.name));
    const match = pickFreeAgentMatch(team, availableFa);
    if (!match || usedGive.has(match.give.name)) continue;

    usedFa.add(match.fa.name);
    usedGive.add(match.give.name);

    const base = {
      teamName: match.team.name,
      giveName: match.give.name,
      giveRole: match.give.role,
      giveQuota: match.give.quota,
      giveFm: match.give.fm,
      faName: match.fa.name,
      faRole: match.fa.role,
      faClub: match.fa.club,
      faQuota: match.fa.quota,
      faFm: match.fa.fm,
      rationale: freeAgentRationale(match),
      agentComment: freeAgentComment(),
    };

    // Articolo di annuncio (goliardico) per ogni proposta.
    articles.push(
      announceFreeAgent(match.team.name, match.give.name, match.fa.name, match.fa.club),
    );

    if (match.team.isUser) {
      // Solo il presidente umano decide: proposta in sospeso.
      proposals.push({ ...base, forUser: true, status: "pending" });
    } else {
      // Squadra AI: decide da sé; se accetta, esegue lo scambio.
      const accepted = Math.random() < 0.5;
      if (accepted) {
        try {
          await repo.executeFreeAgentSwap(match.team.name, match.give.name, match.fa.name);
        } catch {
          // Rosa cambiata nel frattempo: ignora.
        }
      }
      proposals.push({ ...base, forUser: false, status: accepted ? "accepted" : "rejected" });
      articles.push(
        outcomeFreeAgent(match.team.name, match.give.name, match.fa.name, accepted),
      );
    }
  }

  if (proposals.length) await repo.createFreeAgentProposals(proposals);
  for (const a of articles) await repo.addNewsArticle(a);
}

// POST /api/simulate — "Simula giornata"
// Genera voti dei giocatori + formazioni, risultati e classifica; poi i voti AI
// agli allenatori (o da template in demo) e alcuni voti tra presidenti.
export async function POST() {
  const repo = getLeagueRepository();

  try {
    const teams = await repo.getTeams();
    if (teams.length < 2) {
      return NextResponse.json({ error: "Servono almeno 2 squadre." }, { status: 400 });
    }

    const perfByTeam = new Map<string, PerformanceInput[]>();
    const totalByTeam = new Map<string, number>();
    for (const t of teams) {
      const perfs = generateTeamPerformances(t);
      perfByTeam.set(t.name, perfs);
      const total = perfs.filter((p) => p.fielded).reduce((s, p) => s + fv(p), 0);
      totalByTeam.set(t.name, Math.round(total * 2) / 2);
    }

    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    const results: MatchResult[] = [];
    const pointsByTeamName: Record<string, number> = {};
    const addPoints = (name: string, d: number) => {
      pointsByTeamName[name] = (pointsByTeamName[name] ?? 0) + d;
    };

    for (let i = 0; i + 1 < shuffled.length; i += 2) {
      const home = shuffled[i];
      const away = shuffled[i + 1];
      const hs = totalByTeam.get(home.name) ?? 60;
      const as = totalByTeam.get(away.name) ?? 60;
      results.push({
        home: home.name,
        away: away.name,
        homeScore: hs,
        awayScore: as,
        note: buildNote(home, away, perfByTeam, hs, as),
      });
      if (hs > as) addPoints(home.name, 3);
      else if (as > hs) addPoints(away.name, 3);
      else {
        addPoints(home.name, 1);
        addPoints(away.name, 1);
      }
    }

    const allPerfs = [...perfByTeam.values()].flat();
    const giornata = await repo.recordGiornata(results, pointsByTeamName, allPerfs);

    // Voti AI agli allenatori (fallback a template in modalità demo o in caso d'errore).
    let ratings: CoachRatingInput[];
    if (hasAnthropicKey()) {
      try {
        ratings = await aiCoachRatings(perfByTeam, teams);
      } catch {
        ratings = generateDemoCoachRatings(perfByTeam, teams);
      }
    } else {
      ratings = generateDemoCoachRatings(perfByTeam, teams);
    }
    await repo.saveCoachRatings(giornata.number, ratings);

    // Voti simulati tra presidenti (per popolare la bacheca).
    const peerVotes = generateSimulatedPeerVotes(
      teams.map((t) => ({ name: t.name, president: t.president, isUser: t.isUser })),
    );
    await repo.savePeerVotes(giornata.number, peerVotes);

    // Canale svincolati gestito dall'Agente (non blocca l'esito della giornata).
    try {
      await generateFreeAgentProposals(repo, teams);
    } catch (e) {
      console.error("[/api/simulate] svincolati", e);
    }

    return NextResponse.json({ giornata });
  } catch (err) {
    console.error("[/api/simulate]", err);
    return NextResponse.json(
      { error: "Impossibile simulare la giornata. Riprova." },
      { status: 500 },
    );
  }
}
