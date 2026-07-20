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
import type { LeagueRepository, NewTrade } from "./repository";

type PlayerRow = { id: string; name: string; role: string; club: string; quota: number; fm: number };
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
  return { id: p.id, name: p.name, role: p.role as Role, club: p.club, quota: p.quota, fm: p.fm };
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
}
