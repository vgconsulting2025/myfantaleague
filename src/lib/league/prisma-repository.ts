// Implementazione del LeagueRepository su Prisma/SQLite.

import { prisma } from "@/lib/db";
import type {
  Article,
  ArticleInput,
  ChallengeItem,
  Edition,
  FlashItem,
  FreeAgentProposalItem,
  Giornata,
  IdolProgress,
  OwnedSkinItem,
  LeagueConfig,
  LeaguePlayer,
  LeagueTeam,
  MatchResult,
  MuseumEntryInput,
  MuseumItem,
  MuseumType,
  RivalRecord,
  Role,
  TeamIdentity,
  TradeRecord,
  TradeStatus,
} from "./types";
import { nextIdolCounters, idolLevel } from "./idol";
import { applyDerbyResult } from "./rival";
import { generateChallenges } from "./challenges";
import { pickSkin, PACK_COST, coinPackByKey } from "./skins";
import type {
  LeagueRepository,
  NewTrade,
  ImportTeamData,
  PerformanceInput,
  CoachRatingInput,
  PeerVoteInput,
  TeamImageKind,
  FreeAgentInput,
  NewFreeAgentProposal,
  IdolLevelUp,
  DerbyEvent,
} from "./repository";
import type { ImportResultRow } from "./import/types";
import type { CoachRatingItem, PeerVoteItem, PresidentStanding } from "./types";
import { DEMO_TEAMS, DEMO_GIORNATA, DEMO_FLASH, DEMO_FREE_AGENTS } from "./demo-league";
import { computePresidentStandings, validatePeerVote, labelFor } from "./coach";

type PlayerRow = {
  id: string;
  name: string;
  role: string;
  club: string;
  quota: number;
  fm: number;
  imageUrl?: string | null;
  number?: number | null;
  skinKey?: string | null;
};
type TeamRow = {
  id: string;
  slug: string;
  name: string;
  president: string;
  points: number;
  isUser: boolean;
  players: PlayerRow[];
  crestUrl?: string | null;
  jerseyFrontUrl?: string | null;
  jerseyBackUrl?: string | null;
  color1?: string | null;
  color2?: string | null;
  idolPlayerId?: string | null;
  idolSetGiornata?: number | null;
  idolCumFm?: number;
  idolBestCount?: number;
  idolStreak?: number;
  idolLevel?: number;
  idolQuote?: string | null;
  rivalTeamId?: string | null;
  rivalSetGiornata?: number | null;
  rivalWins?: number;
  rivalDraws?: number;
  rivalLosses?: number;
  rivalPointsFor?: number;
  rivalPointsAgainst?: number;
  rivalDerbies?: number;
};

function teamIdentity(t: {
  name: string;
  crestUrl?: string | null;
  jerseyFrontUrl?: string | null;
  jerseyBackUrl?: string | null;
  color1?: string | null;
  color2?: string | null;
}): TeamIdentity {
  return {
    name: t.name,
    crestUrl: t.crestUrl ?? null,
    jerseyFrontUrl: t.jerseyFrontUrl ?? null,
    jerseyBackUrl: t.jerseyBackUrl ?? null,
    color1: t.color1 ?? null,
    color2: t.color2 ?? null,
  };
}

function mapPlayer(
  p: PlayerRow,
  owner?: TeamIdentity,
  idol?: { isIdol: boolean; progress?: IdolProgress | null },
): LeaguePlayer {
  return {
    id: p.id,
    name: p.name,
    role: p.role as Role,
    club: p.club,
    quota: p.quota,
    fm: p.fm,
    imageUrl: p.imageUrl ?? null,
    number: p.number ?? null,
    owner,
    isIdol: idol?.isIdol ?? false,
    idolProgress: idol?.progress ?? null,
    skinKey: p.skinKey ?? null,
  };
}

// Progressi correnti dell'idolo, ricavati dai contatori sulla squadra.
function idolProgressOf(t: {
  idolCumFm?: number;
  idolBestCount?: number;
  idolStreak?: number;
  idolSetGiornata?: number | null;
  idolLevel?: number;
  idolQuote?: string | null;
}): IdolProgress {
  return {
    cumFm: t.idolCumFm ?? 0,
    bestCount: t.idolBestCount ?? 0,
    streak: t.idolStreak ?? 0,
    setGiornata: t.idolSetGiornata ?? null,
    level: t.idolLevel ?? 1,
    quote: t.idolQuote ?? null,
  };
}

// Storico derby corrente ricavato dai contatori sulla squadra.
function rivalRecordOf(t: {
  rivalWins?: number;
  rivalDraws?: number;
  rivalLosses?: number;
  rivalPointsFor?: number;
  rivalPointsAgainst?: number;
  rivalDerbies?: number;
  rivalSetGiornata?: number | null;
}): RivalRecord {
  return {
    wins: t.rivalWins ?? 0,
    draws: t.rivalDraws ?? 0,
    losses: t.rivalLosses ?? 0,
    pointsFor: t.rivalPointsFor ?? 0,
    pointsAgainst: t.rivalPointsAgainst ?? 0,
    derbies: t.rivalDerbies ?? 0,
    setGiornata: t.rivalSetGiornata ?? null,
  };
}

function mapTeam(t: TeamRow): LeagueTeam {
  const roleOrder: Record<string, number> = { P: 0, D: 1, C: 2, A: 3 };
  const identity = teamIdentity(t);
  const idolId = t.idolPlayerId ?? null;
  const progress = idolId ? idolProgressOf(t) : null;
  const players = [...t.players]
    .sort((a, b) => (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9) || b.fm - a.fm)
    .map((p) =>
      mapPlayer(p, identity, {
        isIdol: p.id === idolId,
        progress: p.id === idolId ? progress : null,
      }),
    );
  return {
    id: t.id,
    slug: t.slug,
    name: t.name,
    president: t.president,
    points: t.points,
    isUser: t.isUser,
    players,
    crestUrl: identity.crestUrl,
    jerseyFrontUrl: identity.jerseyFrontUrl,
    jerseyBackUrl: identity.jerseyBackUrl,
    color1: identity.color1,
    color2: identity.color2,
    idolPlayerId: idolId,
    idolSetGiornata: t.idolSetGiornata ?? null,
    rivalTeamId: t.rivalTeamId ?? null,
    rivalSetGiornata: t.rivalSetGiornata ?? null,
    rivalRecord: t.rivalTeamId ? rivalRecordOf(t) : null,
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

function mapFreeAgentProposal(r: {
  id: string;
  createdAt: Date;
  status: string;
  teamName: string;
  giveName: string;
  giveRole: string;
  giveQuota: number;
  giveFm: number;
  faName: string;
  faRole: string;
  faClub: string;
  faQuota: number;
  faFm: number;
  rationale: string;
  agentComment: string;
  forUser: boolean;
}): FreeAgentProposalItem {
  return {
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    status: r.status as FreeAgentProposalItem["status"],
    teamName: r.teamName,
    giveName: r.giveName,
    giveRole: r.giveRole as Role,
    giveQuota: r.giveQuota,
    giveFm: r.giveFm,
    faName: r.faName,
    faRole: r.faRole as Role,
    faClub: r.faClub,
    faQuota: r.faQuota,
    faFm: r.faFm,
    rationale: r.rationale,
    agentComment: r.agentComment,
    forUser: r.forUser,
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

  async getPlayerById(id: string) {
    const p = await prisma.player.findUnique({ where: { id }, include: { team: true } });
    if (!p) return null;
    // Svincolato: nessuna squadra proprietaria.
    if (!p.team) {
      const identity = teamIdentity({ name: "Svincolato" });
      return {
        player: mapPlayer(p, undefined),
        teamName: "Svincolato",
        teamSlug: "",
        isUser: false,
        owner: identity,
      };
    }
    const identity = teamIdentity(p.team);
    const isIdol = p.team.idolPlayerId === p.id;
    return {
      player: mapPlayer(p, identity, {
        isIdol,
        progress: isIdol ? idolProgressOf(p.team) : null,
      }),
      teamName: p.team.name,
      teamSlug: p.team.slug,
      isUser: p.team.isUser,
      owner: identity,
    };
  }

  async setPlayerImage(playerId: string, imageUrl: string | null): Promise<void> {
    await prisma.player.updateMany({ where: { id: playerId }, data: { imageUrl } });
  }

  async setPlayerNumber(playerId: string, number: number | null): Promise<void> {
    await prisma.player.updateMany({ where: { id: playerId }, data: { number } });
  }

  async setUserTeamImage(kind: TeamImageKind, url: string | null): Promise<void> {
    const data =
      kind === "crest"
        ? { crestUrl: url }
        : kind === "jerseyFront"
          ? { jerseyFrontUrl: url }
          : { jerseyBackUrl: url };
    await prisma.team.updateMany({ where: { isUser: true }, data });
  }

  async setUserTeamColors(color1: string | null, color2: string | null): Promise<void> {
    await prisma.team.updateMany({ where: { isUser: true }, data: { color1, color2 } });
  }

  async getConfig(): Promise<LeagueConfig> {
    const c = await prisma.leagueConfig.upsert({
      where: { id: "league" },
      create: { id: "league" },
      update: {},
    });
    return {
      gazzettaName: c.gazzettaName,
      freeAgentEnabled: c.freeAgentEnabled,
      freeAgentMaxPerWeek: c.freeAgentMaxPerWeek,
      acquistoCoinsAbilitato: c.acquistoCoinsAbilitato,
    };
  }

  async updateConfig(patch: Partial<LeagueConfig>): Promise<LeagueConfig> {
    const data: {
      gazzettaName?: string;
      freeAgentEnabled?: boolean;
      freeAgentMaxPerWeek?: number;
      acquistoCoinsAbilitato?: boolean;
    } = {};
    if (patch.gazzettaName !== undefined) data.gazzettaName = patch.gazzettaName;
    if (patch.freeAgentEnabled !== undefined) data.freeAgentEnabled = patch.freeAgentEnabled;
    if (patch.freeAgentMaxPerWeek !== undefined) data.freeAgentMaxPerWeek = patch.freeAgentMaxPerWeek;
    if (patch.acquistoCoinsAbilitato !== undefined)
      data.acquistoCoinsAbilitato = patch.acquistoCoinsAbilitato;
    const c = await prisma.leagueConfig.upsert({
      where: { id: "league" },
      create: { id: "league", ...data },
      update: data,
    });
    return {
      gazzettaName: c.gazzettaName,
      freeAgentEnabled: c.freeAgentEnabled,
      freeAgentMaxPerWeek: c.freeAgentMaxPerWeek,
      acquistoCoinsAbilitato: c.acquistoCoinsAbilitato,
    };
  }

  async getFreeAgents(): Promise<LeaguePlayer[]> {
    const roleOrder: Record<string, number> = { P: 0, D: 1, C: 2, A: 3 };
    const rows = await prisma.player.findMany({ where: { teamId: null } });
    return rows
      .map((p) => mapPlayer(p))
      .sort((a, b) => (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9) || b.fm - a.fm);
  }

  async addFreeAgent(input: FreeAgentInput): Promise<void> {
    await prisma.player.create({
      data: {
        name: input.name,
        role: input.role,
        club: input.club,
        quota: input.quota,
        fm: input.fm,
        teamId: null,
      },
    });
  }

  async addFreeAgentsBulk(inputs: FreeAgentInput[]): Promise<void> {
    if (!inputs.length) return;
    await prisma.player.createMany({
      data: inputs.map((i) => ({
        name: i.name,
        role: i.role,
        club: i.club,
        quota: i.quota,
        fm: i.fm,
        teamId: null,
      })),
    });
  }

  async updateFreeAgent(id: string, patch: Partial<FreeAgentInput>): Promise<void> {
    await prisma.player.updateMany({ where: { id, teamId: null }, data: patch });
  }

  async removeFreeAgent(id: string): Promise<void> {
    await prisma.player.deleteMany({ where: { id, teamId: null } });
  }

  async addNewsArticle(article: ArticleInput): Promise<void> {
    await prisma.article.create({
      data: {
        editionId: null,
        kicker: article.kicker,
        title: article.title,
        body: article.body,
        category: article.category,
        isLead: false,
        order: 0,
      },
    });
  }

  async getRecentNews(limit = 12): Promise<Article[]> {
    const rows = await prisma.article.findMany({
      where: { editionId: null },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map((a) => ({
      id: a.id,
      kicker: a.kicker,
      title: a.title,
      body: a.body,
      category: a.category,
      isLead: a.isLead,
      order: a.order,
      createdAt: a.createdAt.toISOString(),
    }));
  }

  async createFreeAgentProposals(proposals: NewFreeAgentProposal[]): Promise<void> {
    if (!proposals.length) return;
    await prisma.freeAgentProposal.createMany({
      data: proposals.map((p) => ({
        teamName: p.teamName,
        giveName: p.giveName,
        giveRole: p.giveRole,
        giveQuota: p.giveQuota,
        giveFm: p.giveFm,
        faName: p.faName,
        faRole: p.faRole,
        faClub: p.faClub,
        faQuota: p.faQuota,
        faFm: p.faFm,
        rationale: p.rationale,
        agentComment: p.agentComment,
        forUser: p.forUser,
        status: p.status ?? "pending",
      })),
    });
  }

  async getFreeAgentProposals(): Promise<FreeAgentProposalItem[]> {
    const rows = await prisma.freeAgentProposal.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map(mapFreeAgentProposal);
  }

  async getPendingFreeAgentProposals(forUserOnly: boolean): Promise<FreeAgentProposalItem[]> {
    const rows = await prisma.freeAgentProposal.findMany({
      where: { status: "pending", ...(forUserOnly ? { forUser: true } : {}) },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(mapFreeAgentProposal);
  }

  async getFreeAgentProposal(id: string): Promise<FreeAgentProposalItem | null> {
    const r = await prisma.freeAgentProposal.findUnique({ where: { id } });
    return r ? mapFreeAgentProposal(r) : null;
  }

  async setFreeAgentProposalStatus(id: string, status: "accepted" | "rejected"): Promise<void> {
    await prisma.freeAgentProposal.updateMany({ where: { id }, data: { status } });
  }

  async executeFreeAgentSwap(teamName: string, giveName: string, faName: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const team = await tx.team.findFirst({ where: { name: teamName } });
      if (!team) throw new Error("Squadra non trovata");
      const give = await tx.player.findFirst({ where: { name: giveName, teamId: team.id } });
      const fa = await tx.player.findFirst({ where: { name: faName, teamId: null } });
      if (!give || !fa) throw new Error("Scambio con svincolato non più valido");
      await tx.player.update({ where: { id: give.id }, data: { teamId: null } });
      await tx.player.update({ where: { id: fa.id }, data: { teamId: team.id } });
    });
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

  private async requireUserTeam() {
    const t = await prisma.team.findFirst({ where: { isUser: true } });
    if (!t) throw new Error("Nessuna squadra utente.");
    return t;
  }

  async getUserCoins(): Promise<number> {
    const t = await prisma.team.findFirst({ where: { isUser: true }, select: { coins: true } });
    return t?.coins ?? 0;
  }

  async getChallenges(): Promise<ChallengeItem[]> {
    const team = await this.requireUserTeam();
    let rows = await prisma.challenge.findMany({ where: { teamId: team.id }, orderBy: { id: "asc" } });
    if (rows.length === 0) {
      const latest = await prisma.giornata.findFirst({ orderBy: { number: "desc" } });
      await this.renewChallenges(latest?.number ?? 0);
      rows = await prisma.challenge.findMany({ where: { teamId: team.id }, orderBy: { id: "asc" } });
    }
    return rows.map((r) => ({
      id: r.id,
      key: r.key,
      description: r.description,
      reward: r.reward,
      completed: r.completed,
    }));
  }

  async completeChallenge(key: string): Promise<number> {
    const team = await this.requireUserTeam();
    const ch = await prisma.challenge.findFirst({ where: { teamId: team.id, key, completed: false } });
    if (!ch) return 0;
    await prisma.$transaction([
      prisma.challenge.update({ where: { id: ch.id }, data: { completed: true } }),
      prisma.team.update({ where: { id: team.id }, data: { coins: { increment: ch.reward } } }),
    ]);
    return ch.reward;
  }

  async renewChallenges(giornata: number): Promise<void> {
    const team = await this.requireUserTeam();
    const defs = generateChallenges(giornata, 3);
    await prisma.$transaction([
      prisma.challenge.deleteMany({ where: { teamId: team.id } }),
      prisma.challenge.createMany({
        data: defs.map((d) => ({
          teamId: team.id,
          key: d.key,
          description: d.description,
          reward: d.reward,
          giornata,
        })),
      }),
    ]);
  }

  async getOwnedSkins(): Promise<OwnedSkinItem[]> {
    const team = await this.requireUserTeam();
    const grouped = await prisma.ownedSkin.groupBy({
      by: ["skinKey"],
      where: { teamId: team.id },
      _count: { skinKey: true },
    });
    return grouped.map((g) => ({ skinKey: g.skinKey, count: g._count.skinKey }));
  }

  async openPack(): Promise<{ skinKey: string; coins: number }> {
    const team = await this.requireUserTeam();
    if (team.coins < PACK_COST) throw new Error("Fanta Coins insufficienti per aprire una bustina.");
    const skin = pickSkin();
    const updated = await prisma.$transaction(async (tx) => {
      const t = await tx.team.update({
        where: { id: team.id },
        data: { coins: { decrement: PACK_COST } },
      });
      await tx.ownedSkin.create({ data: { teamId: team.id, skinKey: skin.key } });
      return t;
    });
    return { skinKey: skin.key, coins: updated.coins };
  }

  async applySkin(playerId: string, skinKey: string | null): Promise<void> {
    const team = await this.requireUserTeam();
    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player || player.teamId !== team.id) throw new Error("Giocatore non della tua squadra.");
    if (team.idolPlayerId === playerId) throw new Error("Non puoi applicare skin all'idolo.");
    if (skinKey) {
      const owned = await prisma.ownedSkin.findFirst({ where: { teamId: team.id, skinKey } });
      if (!owned) throw new Error("Skin non posseduta.");
    }
    await prisma.player.update({ where: { id: playerId }, data: { skinKey } });
  }

  async buyCoins(pack: string): Promise<{ coins: number }> {
    const team = await this.requireUserTeam();
    const p = coinPackByKey(pack);
    if (!p) throw new Error("Pacchetto non valido.");
    // Nessun pagamento reale: accredito segnaposto (usato solo se il flag è ON).
    const t = await prisma.team.update({
      where: { id: team.id },
      data: { coins: { increment: p.coins } },
    });
    return { coins: t.coins };
  }

  async addMuseumEntry(entry: MuseumEntryInput): Promise<void> {
    await prisma.museumEntry.create({
      data: {
        type: entry.type,
        title: entry.title,
        subtitle: entry.subtitle ?? null,
        detail: entry.detail ?? null,
        giornata: entry.giornata ?? null,
        value: entry.value ?? null,
      },
    });
  }

  async getMuseumEntries(limit = 200): Promise<MuseumItem[]> {
    const rows = await prisma.museumEntry.findMany({ orderBy: { createdAt: "desc" }, take: limit });
    return rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      type: r.type as MuseumType,
      title: r.title,
      subtitle: r.subtitle,
      detail: r.detail,
      giornata: r.giornata,
      value: r.value,
    }));
  }

  async getMuseumTopValue(type: MuseumType): Promise<number | null> {
    const agg = await prisma.museumEntry.aggregate({ where: { type }, _max: { value: true } });
    return agg._max.value ?? null;
  }

  async setRival(teamId: string, giornata: number): Promise<void> {
    const userTeam = await prisma.team.findFirst({ where: { isUser: true } });
    if (!userTeam) throw new Error("Nessuna squadra utente.");
    const rival = await prisma.team.findUnique({ where: { id: teamId } });
    if (!rival || rival.id === userTeam.id) throw new Error("Rivale non valido.");
    // Nuova scelta del rivale: azzera lo storico dei derby.
    await prisma.team.update({
      where: { id: userTeam.id },
      data: {
        rivalTeamId: teamId,
        rivalSetGiornata: giornata,
        rivalWins: 0,
        rivalDraws: 0,
        rivalLosses: 0,
        rivalPointsFor: 0,
        rivalPointsAgainst: 0,
        rivalDerbies: 0,
      },
    });
  }

  async advanceRivalTracking(results: MatchResult[]): Promise<DerbyEvent[]> {
    const teams = await prisma.team.findMany({ where: { NOT: { rivalTeamId: null } } });
    const events: DerbyEvent[] = [];
    for (const team of teams) {
      if (!team.rivalTeamId) continue;
      const rival = await prisma.team.findUnique({ where: { id: team.rivalTeamId } });
      if (!rival) continue;
      // Il derby: il risultato in cui le due squadre si sono affrontate.
      const match = results.find(
        (r) =>
          (r.home === team.name && r.away === rival.name) ||
          (r.home === rival.name && r.away === team.name),
      );
      if (!match) continue;
      const userScore = match.home === team.name ? match.homeScore : match.awayScore;
      const rivalScore = match.home === team.name ? match.awayScore : match.homeScore;
      const next = applyDerbyResult(
        {
          wins: team.rivalWins,
          draws: team.rivalDraws,
          losses: team.rivalLosses,
          pointsFor: team.rivalPointsFor,
          pointsAgainst: team.rivalPointsAgainst,
          derbies: team.rivalDerbies,
        },
        userScore,
        rivalScore,
      );
      await prisma.team.update({
        where: { id: team.id },
        data: {
          rivalWins: next.wins,
          rivalDraws: next.draws,
          rivalLosses: next.losses,
          rivalPointsFor: next.pointsFor,
          rivalPointsAgainst: next.pointsAgainst,
          rivalDerbies: next.derbies,
        },
      });
      events.push({
        userTeamName: team.name,
        rivalTeamName: rival.name,
        userScore,
        rivalScore,
        record: next,
      });
    }
    return events;
  }

  async setIdol(playerId: string, giornata: number): Promise<void> {
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { team: true },
    });
    if (!player || !player.team || !player.team.isUser) {
      throw new Error("Il giocatore non appartiene alla tua squadra.");
    }
    // Nuova designazione: azzera i contatori di progresso e riparte da Bronzo.
    await prisma.team.update({
      where: { id: player.team.id },
      data: {
        idolPlayerId: playerId,
        idolSetGiornata: giornata,
        idolCumFm: 0,
        idolBestCount: 0,
        idolStreak: 0,
        idolLevel: 1,
        idolQuote: null,
      },
    });
  }

  async advanceIdolTracking(performances: PerformanceInput[]): Promise<IdolLevelUp[]> {
    const teams = await prisma.team.findMany({ where: { NOT: { idolPlayerId: null } } });
    const levelUps: IdolLevelUp[] = [];
    for (const team of teams) {
      if (!team.idolPlayerId) continue;
      const idol = await prisma.player.findUnique({ where: { id: team.idolPlayerId } });
      // Idolo non più nella rosa (ceduto o svincolato): azzera la designazione.
      if (!idol || idol.teamId !== team.id) {
        await prisma.team.update({
          where: { id: team.id },
          data: {
            idolPlayerId: null,
            idolSetGiornata: null,
            idolCumFm: 0,
            idolBestCount: 0,
            idolStreak: 0,
            idolLevel: 1,
            idolQuote: null,
          },
        });
        continue;
      }
      const teamPerfs = performances.filter((p) => p.teamName === team.name);
      const next = nextIdolCounters(
        { cumFm: team.idolCumFm, bestCount: team.idolBestCount, streak: team.idolStreak },
        teamPerfs,
        idol.name,
      );
      // Ricalcola il livello dai nuovi contatori (cresce in modo monotòno).
      const newLevel = idolLevel(next);
      if (newLevel > team.idolLevel) {
        levelUps.push({
          teamName: team.name,
          playerName: idol.name,
          fromLevel: team.idolLevel,
          toLevel: newLevel,
        });
      }
      await prisma.team.update({
        where: { id: team.id },
        data: {
          idolCumFm: next.cumFm,
          idolBestCount: next.bestCount,
          idolStreak: next.streak,
          idolLevel: newLevel,
        },
      });
    }
    return levelUps;
  }

  async setIdolQuote(teamName: string, quote: string): Promise<void> {
    await prisma.team.updateMany({ where: { name: teamName }, data: { idolQuote: quote } });
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
        await tx.freeAgentProposal.deleteMany();
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
        await tx.freeAgentProposal.deleteMany();
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
        await tx.player.createMany({
          data: DEMO_FREE_AGENTS.map((p) => ({
            name: p.name,
            role: p.role,
            club: p.club,
            quota: p.quota,
            fm: p.fm,
            teamId: null,
          })),
        });
        await tx.leagueConfig.upsert({ where: { id: "league" }, create: { id: "league" }, update: {} });
      },
      { timeout: 30000 },
    );
  }
}
