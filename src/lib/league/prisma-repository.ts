// Implementazione del LeagueRepository su Prisma/SQLite.

import { prisma } from "@/lib/db";
import type {
  ArticleInput,
  Edition,
  FlashItem,
  Giornata,
  LeaguePlayer,
  LeagueTeam,
  MatchResult,
  Role,
  TradeRecord,
  TradeStatus,
} from "./types";
import type {
  LeagueRepository,
  NewTrade,
  ImportTeamData,
  PerformanceInput,
  CoachRatingInput,
  PeerVoteInput,
} from "./repository";
import type { ImportResultRow } from "./import/types";
import type { CoachRatingItem, PeerVoteItem, PresidentStanding } from "./types";
import { DEMO_TEAMS, DEMO_GIORNATA, DEMO_FLASH } from "./demo-league";
import { computePresidentStandings, validatePeerVote, labelFor } from "./coach";

type PlayerRow = {
  id: string;
  name: string;
  role: string;
  club: string;
  quota: number;
  fm: number;
  imageUrl?: string | null;
};
type TeamRow = {
  id: string;
  slug: string;
  name: string;
  president: string;
  points: number;
  isUser: boolean;
  players: PlayerRow[];
};

function mapPlayer(p: PlayerRow): LeaguePlayer {
  return {
    id: p.id,
    name: p.name,
    role: p.role as Role,
    club: p.club,
    quota: p.quota,
    fm: p.fm,
    imageUrl: p.imageUrl ?? null,
  };
}

function mapTeam(t: TeamRow): LeagueTeam {
  const roleOrder: Record<string, number> = { P: 0, D: 1, C: 2, A: 3 };
  const players = [...t.players]
    .sort((a, b) => (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9) || b.fm - a.fm)
    .map(mapPlayer);
  return {
    id: t.id,
    slug: t.slug,
    name: t.name,
    president: t.president,
    points: t.points,
    isUser: t.isUser,
    players,
  };
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "team";
}

function uniqueSlugs(names: string[]): string[] {
  const seen = new Map<string, number>();
  return names.map((n) => {
    const base = slugify(n);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  });
}

function pickUserIndex(teams: { name: string }[], myTeamName: string | null): number {
  if (!teams.length) return -1;
  if (myTeamName) {
    const i = teams.findIndex((t) => t.name === myTeamName);
    if (i >= 0) return i;
  }
  return 0;
}

export class PrismaLeagueRepository implements LeagueRepository {
  async getTeams(): Promise<LeagueTeam[]> {
    const teams = await prisma.team.findMany({
      include: { players: true },
      orderBy: { createdAt: "asc" },
    });
    return teams.map(mapTeam);
  }

  async getUserTeam(): Promise<LeagueTeam> {
    const team =
      (await prisma.team.findFirst({ where: { isUser: true }, include: { players: true } })) ??
      (await prisma.team.findFirst({ include: { players: true }, orderBy: { createdAt: "asc" } }));
    if (!team) throw new Error("Nessuna squadra nel database. Esegui il seed.");
    return mapTeam(team);
  }

  async getStandings(): Promise<LeagueTeam[]> {
    const teams = await prisma.team.findMany({
      include: { players: true },
      orderBy: [{ points: "desc" }, { name: "asc" }],
    });
    return teams.map(mapTeam);
  }

  async getLatestGiornata(): Promise<Giornata | null> {
    const g = await prisma.giornata.findFirst({
      orderBy: { number: "desc" },
      include: { results: true },
    });
    if (!g) return null;
    return {
      number: g.number,
      playedAt: g.playedAt.toISOString(),
      results: g.results.map((r) => ({
        home: r.homeName,
        away: r.awayName,
        homeScore: r.homeScore,
        awayScore: r.awayScore,
        note: r.note,
      })),
    };
  }

  async getEditions(): Promise<Edition[]> {
    const editions = await prisma.edition.findMany({
      orderBy: { createdAt: "desc" },
      include: { articles: { orderBy: { order: "asc" } } },
    });
    return editions.map((e) => ({
      id: e.id,
      createdAt: e.createdAt.toISOString(),
      giornata: e.giornata,
      articles: e.articles.map((a) => ({
        id: a.id,
        kicker: a.kicker,
        title: a.title,
        body: a.body,
        category: a.category,
        isLead: a.isLead,
        order: a.order,
      })),
    }));
  }

  async getLatestEdition(): Promise<Edition | null> {
    const editions = await this.getEditions();
    return editions[0] ?? null;
  }

  async getTrades(): Promise<TradeRecord[]> {
    const trades = await prisma.trade.findMany({ orderBy: { createdAt: "desc" } });
    return trades.map((t) => ({
      id: t.id,
      createdAt: t.createdAt.toISOString(),
      status: t.status as TradeStatus,
      fromTeam: t.fromTeam,
      toTeam: t.toTeam,
      giveName: t.giveName,
      receiveName: t.receiveName,
      rationale: t.rationale,
      agentComment: t.agentComment,
    }));
  }

  async getPlayerById(id: string) {
    const p = await prisma.player.findUnique({ where: { id }, include: { team: true } });
    if (!p) return null;
    return {
      player: mapPlayer(p),
      teamName: p.team.name,
      teamSlug: p.team.slug,
      isUser: p.team.isUser,
    };
  }

  async setPlayerImage(playerId: string, imageUrl: string | null): Promise<void> {
    await prisma.player.updateMany({ where: { id: playerId }, data: { imageUrl } });
  }

  async getPerformances(giornataNumber: number): Promise<PerformanceInput[]> {
    const g = await prisma.giornata.findUnique({
      where: { number: giornataNumber },
      include: { performances: true },
    });
    if (!g) return [];
    return g.performances.map((p) => ({
      teamName: p.teamName,
      president: p.president,
      playerName: p.playerName,
      role: p.role as Role,
      vote: p.vote,
      bonus: p.bonus,
      fielded: p.fielded,
    }));
  }

  async getCoachRatings(limit = 12): Promise<CoachRatingItem[]> {
    const rows = await prisma.coachRating.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { giornata: true },
    });
    return rows.map((r) => ({
      id: r.id,
      giornata: r.giornata.number,
      teamName: r.teamName,
      president: r.president,
      score: r.score,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async getCoachRatingsForGiornata(giornataNumber: number): Promise<CoachRatingItem[]> {
    const g = await prisma.giornata.findUnique({
      where: { number: giornataNumber },
      include: { coachRatings: true },
    });
    if (!g) return [];
    return g.coachRatings.map((r) => ({
      id: r.id,
      giornata: g.number,
      teamName: r.teamName,
      president: r.president,
      score: r.score,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async getPeerVotes(): Promise<PeerVoteItem[]> {
    const [rows, teams] = await Promise.all([
      prisma.peerVote.findMany({
        where: { hidden: false },
        orderBy: { createdAt: "desc" },
        include: { giornata: true },
      }),
      prisma.team.findMany({ select: { name: true, president: true } }),
    ]);
    const presByTeam = new Map(teams.map((t) => [t.name, t.president]));
    return rows.map((v) => ({
      id: v.id,
      giornata: v.giornata.number,
      fromTeam: v.fromTeam,
      toTeam: v.toTeam,
      fromLabel: labelFor(v.fromTeam, presByTeam.get(v.fromTeam) ?? ""),
      score: v.score,
      comment: v.comment,
      hidden: v.hidden,
      createdAt: v.createdAt.toISOString(),
    }));
  }

  async getPresidentStandings(): Promise<PresidentStanding[]> {
    const [teams, ratings, votes] = await Promise.all([
      prisma.team.findMany({
        orderBy: { createdAt: "asc" },
        select: { name: true, president: true, isUser: true },
      }),
      prisma.coachRating.findMany({ select: { teamName: true, score: true } }),
      prisma.peerVote.findMany({ select: { toTeam: true, score: true, hidden: true } }),
    ]);
    return computePresidentStandings(
      teams.map((t) => ({ teamName: t.name, president: t.president, isUser: t.isUser })),
      ratings,
      votes,
    );
  }

  async saveCoachRatings(giornataNumber: number, ratings: CoachRatingInput[]): Promise<void> {
    const g = await prisma.giornata.findUnique({ where: { number: giornataNumber } });
    if (!g || !ratings.length) return;
    await prisma.coachRating.createMany({
      data: ratings.map((r) => ({
        giornataId: g.id,
        teamName: r.teamName,
        president: r.president,
        score: r.score,
        comment: r.comment,
      })),
    });
  }

  async savePeerVotes(giornataNumber: number, votes: PeerVoteInput[]): Promise<void> {
    const g = await prisma.giornata.findUnique({ where: { number: giornataNumber } });
    if (!g || !votes.length) return;
    await prisma.peerVote.createMany({
      data: votes.map((v) => ({
        giornataId: g.id,
        fromTeam: v.fromTeam,
        toTeam: v.toTeam,
        score: v.score,
        comment: v.comment,
      })),
    });
  }

  async addPeerVote(
    fromTeam: string,
    toTeam: string,
    score: number,
    comment: string,
  ): Promise<{ ok: boolean; error?: string }> {
    const valid = validatePeerVote(fromTeam, toTeam, score, comment);
    if (!valid.ok) return valid;
    const g = await prisma.giornata.findFirst({ orderBy: { number: "desc" } });
    if (!g) return { ok: false, error: "Nessuna giornata giocata: simula prima una giornata." };
    const count = await prisma.team.count({ where: { name: { in: [fromTeam, toTeam] } } });
    if (count < 2) return { ok: false, error: "Squadra non trovata." };
    await prisma.peerVote.create({
      data: { giornataId: g.id, fromTeam, toTeam, score, comment: comment.slice(0, 140) },
    });
    return { ok: true };
  }

  async hidePeerVote(id: string): Promise<void> {
    await prisma.peerVote.updateMany({ where: { id }, data: { hidden: true } });
  }

  async getFlashNews(limit = 8): Promise<FlashItem[]> {
    const items = await prisma.flashNews.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return items.map((f) => ({
      id: f.id,
      createdAt: f.createdAt.toISOString(),
      text: f.text,
      kind: f.kind,
    }));
  }

  async saveEdition(articles: ArticleInput[], giornata: number | null): Promise<Edition> {
    const edition = await prisma.edition.create({
      data: {
        giornata,
        articles: {
          create: articles.map((a, i) => ({
            kicker: a.kicker,
            title: a.title,
            body: a.body,
            category: a.category,
            isLead: i === 0,
            order: i,
          })),
        },
      },
      include: { articles: { orderBy: { order: "asc" } } },
    });
    return {
      id: edition.id,
      createdAt: edition.createdAt.toISOString(),
      giornata: edition.giornata,
      articles: edition.articles.map((a) => ({
        id: a.id,
        kicker: a.kicker,
        title: a.title,
        body: a.body,
        category: a.category,
        isLead: a.isLead,
        order: a.order,
      })),
    };
  }

  async recordTrade(trade: NewTrade): Promise<TradeRecord> {
    const t = await prisma.trade.create({ data: trade });
    return {
      id: t.id,
      createdAt: t.createdAt.toISOString(),
      status: t.status as TradeStatus,
      fromTeam: t.fromTeam,
      toTeam: t.toTeam,
      giveName: t.giveName,
      receiveName: t.receiveName,
      rationale: t.rationale,
      agentComment: t.agentComment,
    };
  }

  async executeTradeSwap(
    userTeamName: string,
    otherTeamName: string,
    giveName: string,
    receiveName: string,
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const userTeam = await tx.team.findFirst({
        where: { name: userTeamName },
        include: { players: true },
      });
      const otherTeam = await tx.team.findFirst({
        where: { name: otherTeamName },
        include: { players: true },
      });
      if (!userTeam || !otherTeam) throw new Error("Squadra non trovata");

      const givePlayer = userTeam.players.find((p) => p.name === giveName);
      const receivePlayer = otherTeam.players.find((p) => p.name === receiveName);
      if (!givePlayer || !receivePlayer) throw new Error("Scambio non più valido: giocatore assente");

      // Sposta i due giocatori nelle rispettive nuove rose.
      await tx.player.update({ where: { id: givePlayer.id }, data: { teamId: otherTeam.id } });
      await tx.player.update({ where: { id: receivePlayer.id }, data: { teamId: userTeam.id } });
    });
  }

  async pushFlashNews(text: string, kind = "mercato"): Promise<FlashItem> {
    const f = await prisma.flashNews.create({ data: { text, kind } });
    return { id: f.id, createdAt: f.createdAt.toISOString(), text: f.text, kind: f.kind };
  }

  async recordGiornata(
    results: MatchResult[],
    pointsByTeamName: Record<string, number>,
    performances?: PerformanceInput[],
  ): Promise<Giornata> {
    return prisma.$transaction(async (tx) => {
      const last = await tx.giornata.findFirst({ orderBy: { number: "desc" } });
      const number = (last?.number ?? 0) + 1;

      const g = await tx.giornata.create({
        data: {
          number,
          results: {
            create: results.map((r) => ({
              homeName: r.home,
              awayName: r.away,
              homeScore: r.homeScore,
              awayScore: r.awayScore,
              note: r.note,
            })),
          },
        },
        include: { results: true },
      });

      if (performances && performances.length) {
        await tx.performance.createMany({
          data: performances.map((p) => ({
            giornataId: g.id,
            teamName: p.teamName,
            president: p.president,
            playerName: p.playerName,
            role: p.role,
            vote: p.vote,
            bonus: p.bonus,
            fielded: p.fielded,
          })),
        });
      }

      for (const [teamName, delta] of Object.entries(pointsByTeamName)) {
        if (!delta) continue;
        await tx.team.updateMany({ where: { name: teamName }, data: { points: { increment: delta } } });
      }

      return {
        number: g.number,
        playedAt: g.playedAt.toISOString(),
        results: g.results.map((r) => ({
          home: r.homeName,
          away: r.awayName,
          homeScore: r.homeScore,
          awayScore: r.awayScore,
          note: r.note,
        })),
      };
    });
  }

  async replaceLeague(teams: ImportTeamData[], myTeamName: string | null): Promise<void> {
    await prisma.$transaction(
      async (tx) => {
        await tx.flashNews.deleteMany();
        await tx.article.deleteMany();
        await tx.edition.deleteMany();
        await tx.trade.deleteMany();
        await tx.result.deleteMany();
        await tx.giornata.deleteMany();
        await tx.player.deleteMany();
        await tx.team.deleteMany();

        const slugs = uniqueSlugs(teams.map((t) => t.name));
        const userIdx = pickUserIndex(teams, myTeamName);
        for (let i = 0; i < teams.length; i++) {
          const t = teams[i];
          await tx.team.create({
            data: {
              slug: slugs[i],
              name: t.name,
              president: "—",
              points: 0,
              isUser: i === userIdx,
              players: {
                create: t.players.map((p) => ({
                  name: p.name,
                  role: p.role,
                  club: p.club,
                  quota: p.quota,
                  fm: p.fm,
                })),
              },
            },
          });
        }
      },
      { timeout: 30000 },
    );
  }

  async mergeRoster(teams: ImportTeamData[], myTeamName: string | null): Promise<void> {
    await prisma.$transaction(
      async (tx) => {
        for (const t of teams) {
          const existing = await tx.team.findFirst({ where: { name: t.name } });
          if (existing) {
            await tx.player.deleteMany({ where: { teamId: existing.id } });
            await tx.player.createMany({
              data: t.players.map((p) => ({
                name: p.name,
                role: p.role,
                club: p.club,
                quota: p.quota,
                fm: p.fm,
                teamId: existing.id,
              })),
            });
          } else {
            let slug = slugify(t.name);
            if (await tx.team.findUnique({ where: { slug } })) {
              slug = `${slug}-${Date.now().toString(36)}`;
            }
            await tx.team.create({
              data: {
                slug,
                name: t.name,
                president: "—",
                points: 0,
                isUser: false,
                players: {
                  create: t.players.map((p) => ({
                    name: p.name,
                    role: p.role,
                    club: p.club,
                    quota: p.quota,
                    fm: p.fm,
                  })),
                },
              },
            });
          }
        }

        if (myTeamName) {
          await tx.team.updateMany({ data: { isUser: false } });
          await tx.team.updateMany({ where: { name: myTeamName }, data: { isUser: true } });
        } else if ((await tx.team.count({ where: { isUser: true } })) === 0) {
          const first = await tx.team.findFirst({ orderBy: { createdAt: "asc" } });
          if (first) await tx.team.update({ where: { id: first.id }, data: { isUser: true } });
        }
      },
      { timeout: 30000 },
    );
  }

  async importResults(results: ImportResultRow[]): Promise<void> {
    await prisma.$transaction(
      async (tx) => {
        await tx.result.deleteMany();
        await tx.giornata.deleteMany();

        const byGiornata = new Map<number, ImportResultRow[]>();
        for (const r of results) {
          if (!byGiornata.has(r.giornata)) byGiornata.set(r.giornata, []);
          byGiornata.get(r.giornata)!.push(r);
        }
        for (const [number, rows] of [...byGiornata.entries()].sort((a, b) => a[0] - b[0])) {
          await tx.giornata.create({
            data: {
              number,
              results: {
                create: rows.map((r) => ({
                  homeName: r.home,
                  awayName: r.away,
                  homeScore: r.homeScore,
                  awayScore: r.awayScore,
                  note: r.note,
                })),
              },
            },
          });
        }

        // Ricalcola i punti dai risultati (3 vittoria / 1 pareggio).
        const points = new Map<string, number>();
        const add = (name: string, d: number) => points.set(name, (points.get(name) ?? 0) + d);
        for (const r of results) {
          if (r.homeScore > r.awayScore) add(r.home, 3);
          else if (r.awayScore > r.homeScore) add(r.away, 3);
          else {
            add(r.home, 1);
            add(r.away, 1);
          }
        }
        await tx.team.updateMany({ data: { points: 0 } });
        for (const [name, pts] of points.entries()) {
          await tx.team.updateMany({ where: { name }, data: { points: pts } });
        }
      },
      { timeout: 30000 },
    );
  }

  async resetToDemo(): Promise<void> {
    await prisma.$transaction(
      async (tx) => {
        await tx.flashNews.deleteMany();
        await tx.article.deleteMany();
        await tx.edition.deleteMany();
        await tx.trade.deleteMany();
        await tx.result.deleteMany();
        await tx.giornata.deleteMany();
        await tx.player.deleteMany();
        await tx.team.deleteMany();

        for (const t of DEMO_TEAMS) {
          await tx.team.create({
            data: {
              slug: t.slug,
              name: t.name,
              president: t.president,
              points: t.points,
              isUser: t.isUser ?? false,
              players: { create: t.players },
            },
          });
        }
        await tx.giornata.create({
          data: {
            number: DEMO_GIORNATA.number,
            results: {
              create: DEMO_GIORNATA.results.map((r) => ({
                homeName: r.home,
                awayName: r.away,
                homeScore: r.homeScore,
                awayScore: r.awayScore,
                note: r.note,
              })),
            },
          },
        });
        await tx.flashNews.create({ data: { text: DEMO_FLASH, kind: "generic" } });
      },
      { timeout: 30000 },
    );
  }
}
