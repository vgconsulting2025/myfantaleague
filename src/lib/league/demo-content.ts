// Generazione di contenuti da TEMPLATE locali (modalità demo).
// Usata dalle API route quando ANTHROPIC_API_KEY non è impostata: niente AI, ma
// frasi precompilate variate casualmente e riempite con i dati reali della lega
// (nomi squadre, presidenti, risultati, giocatori). Logica pura → testabile.

import type {
  ArticleInput,
  Giornata,
  LeaguePlayer,
  LeagueTeam,
  Role,
  TradeProposal,
  TradeRecord,
} from "./types";

const ROLE_IT: Record<Role, string> = {
  P: "portiere",
  D: "difensore",
  C: "centrocampista",
  A: "attaccante",
};

function pick<T>(a: T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}

function shuffle<T>(a: T[]): T[] {
  return [...a].sort(() => Math.random() - 0.5);
}

/* ---------------- Articoli della Gazzetta ---------------- */

export interface DemoArticleContext {
  standings: LeagueTeam[];
  latest: Giornata | null;
  trades: TradeRecord[];
}

export function generateDemoArticles(ctx: DemoArticleContext): ArticleInput[] {
  const { standings, latest, trades } = ctx;
  const leader = standings[0];
  const last = standings[standings.length - 1];
  const articles: ArticleInput[] = [];

  // 1. Apertura: il risultato più clamoroso dell'ultima giornata.
  if (latest && latest.results.length) {
    const r = [...latest.results].sort(
      (a, b) => Math.abs(b.homeScore - b.awayScore) - Math.abs(a.homeScore - a.awayScore),
    )[0];
    const draw = r.homeScore === r.awayScore;
    const winner = r.homeScore > r.awayScore ? r.home : r.away;
    const loser = r.homeScore > r.awayScore ? r.away : r.home;
    articles.push({
      kicker: pick(["Il big match", "La copertina", "Cronaca di giornata"]),
      category: "CRONACA",
      title: draw
        ? pick([
            `${r.home} e ${r.away} non si fanno male`,
            `Pari e patta tra ${r.home} e ${r.away}`,
            `${r.home}-${r.away}, divisione della posta`,
          ])
        : pick([
            `${winner} travolge ${loser}`,
            `Colpo grosso della ${winner}`,
            `${loser} ko, la ${winner} fa festa`,
            `La ${winner} passeggia sul ${loser}`,
          ]),
      body: `${r.home} ${r.homeScore} - ${r.awayScore} ${r.away}. ${r.note} ${pick([
        "Al bar non si parla d'altro.",
        "Tabellino da incorniciare.",
        "Una giornata che pesa in classifica.",
        "La Lega Bar Centrale ringrazia per lo spettacolo.",
      ])}`,
    });
  } else if (leader) {
    articles.push({
      kicker: "Anteprima",
      category: "CRONACA",
      title: pick([`La ${leader.name} detta legge`, "Si accende la Lega Bar Centrale"]),
      body: `Campionato pronto a ripartire. In vetta la ${leader.name} del presidente ${leader.president}, ma nessuno vuole fare da sparring partner.`,
    });
  }

  // 2. Pagelle: elogio alla capolista.
  if (leader) {
    articles.push({
      kicker: "Il primo della classe",
      category: "PAGELLE",
      title: pick([
        `${leader.name} da 8 in pagella`,
        `Applausi per ${leader.name}`,
        `${leader.president}, che gestione`,
      ]),
      body: `Con ${leader.points} punti la ${leader.name} di ${leader.president} guida la classifica. ${pick(
        [
          "Rosa profonda e nervi saldi.",
          "Difesa di ferro e attacco che non perdona.",
          "Il segreto? Un mercato fatto col bilancino.",
        ],
      )}`,
    });
  }

  // 3. Polemiche: la squadra in fondo alla classifica.
  if (last && last.id !== leader?.id) {
    articles.push({
      kicker: "Aria di crisi",
      category: "POLEMICHE",
      title: pick([
        `${last.name} nel mirino`,
        `Contestazione in casa ${last.name}`,
        `${last.president} sulla graticola`,
      ]),
      body: `Ultimo posto e musi lunghi: la ${last.name} di ${last.president} raccoglie appena ${last.points} punti. ${pick(
        [
          "Il presidente promette scintille sul mercato.",
          "Lo spogliatoio mugugna.",
          "Servono rinforzi, e in fretta.",
        ],
      )}`,
    });
  }

  // 4. Mercato: l'ultimo scambio (o mercato fermo).
  const lastTrade = trades[0];
  if (lastTrade) {
    articles.push({
      kicker: "Calciomercato",
      category: "MERCATO",
      title:
        lastTrade.status === "accepted"
          ? pick([
              `Affare fatto: ${lastTrade.giveName} cambia casacca`,
              `${lastTrade.toTeam}, ecco ${lastTrade.giveName}`,
            ])
          : pick([
              `Salta lo scambio ${lastTrade.giveName}-${lastTrade.receiveName}`,
              `Niente da fare tra ${lastTrade.fromTeam} e ${lastTrade.toTeam}`,
            ]),
      body:
        lastTrade.status === "accepted"
          ? `${lastTrade.fromTeam} cede ${lastTrade.giveName} a ${lastTrade.toTeam} e abbraccia ${lastTrade.receiveName}. ${pick(
              [
                "L'Agente incassa la commissione.",
                "Stretta di mano e trattativa chiusa.",
                "Colpo che può cambiare la stagione.",
              ],
            )}`
          : `Fumata nera tra ${lastTrade.fromTeam} e ${lastTrade.toTeam}: lo scambio ${lastTrade.giveName} ↔ ${lastTrade.receiveName} è saltato. ${pick(
              ["Trattativa rimandata.", "Presidenti ai ferri corti.", "Se ne riparla la prossima settimana."],
            )}`,
    });
  } else {
    articles.push({
      kicker: "Calciomercato",
      category: "MERCATO",
      title: pick(["Mercato ancora fermo", "L'Agente affila le armi"]),
      body: `Nessuno scambio ufficiale finora nella Lega Bar Centrale. ${pick([
        "Ma le voci si rincorrono.",
        "I presidenti studiano le rose avversarie.",
        "Chiamate l'Agente e vedrete scintille.",
      ])}`,
    });
  }

  // 5. Spogliatoio: retroscena su una squadra a caso.
  if (standings.length) {
    const t = pick(standings);
    articles.push({
      kicker: "Retroscena",
      category: "SPOGLIATOIO",
      title: pick([
        `${t.president}: «Ci crediamo»`,
        `Nello spogliatoio della ${t.name}`,
        `${t.name}, parola d'ordine compattezza`,
      ]),
      body: `${pick(["Clima sereno", "Tensione alle stelle", "Grande entusiasmo"])} in casa ${t.name}: il presidente ${t.president} ${pick(
        ["carica l'ambiente", "predica calma", "promette colpi di mercato"],
      )}. ${pick([
        "La rosa risponde presente.",
        "Obiettivo dichiarato: la zona alta.",
        "Nessuno vuole restare a guardare.",
      ])}`,
    });
  }

  return articles;
}

/* ---------------- Proposte di scambio dell'Agente ---------------- */

function buildProposal(
  userTeam: LeagueTeam,
  other: LeagueTeam,
  role: Role,
  give: LeaguePlayer,
  receive: LeaguePlayer,
): TradeProposal {
  return {
    otherTeam: other.name,
    give: give.name,
    receive: receive.name,
    rationale: pick([
      `Scambio alla pari tra ${ROLE_IT[role]}: ${give.name} (${give.club}) porta minuti a ${other.name}, mentre ${receive.name} (${receive.club}) alza la fantamedia di ${userTeam.name} nello stesso reparto.`,
      `${userTeam.name} cede ${give.name} e prende ${receive.name}: stesso ruolo e quotazioni vicine (${give.quota} contro ${receive.quota}), entrambe ci guadagnano in equilibrio.`,
      `${other.name} sogna ${give.name} da tempo; in cambio ${receive.name} è il ${ROLE_IT[role]} giusto per completare la rosa di ${userTeam.name}.`,
    ]),
    agentComment: pick([
      "Fidatevi, è oro colato.",
      "Lo chiudo entro sera.",
      "Un affare così non capita due volte.",
      "Ci metto la faccia.",
      "Stretta di mano e via.",
    ]),
  };
}

export function generateDemoProposals(
  userTeam: LeagueTeam,
  otherTeams: LeagueTeam[],
): TradeProposal[] {
  const out: TradeProposal[] = [];
  const usedGives = new Set<string>();
  const usedRoles = new Set<Role>();
  const roles: Role[] = ["A", "C", "D", "P"];

  const tryAdd = (other: LeagueTeam, allowReuse: boolean): boolean => {
    // Ruoli mescolati, ma quelli non ancora usati vengono provati per primi
    // (così le 3 proposte tendono a coprire reparti diversi).
    const ordered = shuffle(roles).sort(
      (a, b) => (usedRoles.has(a) ? 1 : 0) - (usedRoles.has(b) ? 1 : 0),
    );
    for (const role of ordered) {
      const gives = userTeam.players.filter(
        (p) => p.role === role && (allowReuse || !usedGives.has(p.name)),
      );
      const receives = other.players.filter((p) => p.role === role);
      if (gives.length && receives.length) {
        const give = pick(gives);
        const receive = pick(receives);
        usedGives.add(give.name);
        usedRoles.add(role);
        out.push(buildProposal(userTeam, other, role, give, receive));
        return true;
      }
    }
    return false;
  };

  // Preferisci 3 squadre avversarie diverse, con giocatori ceduti distinti.
  for (const other of shuffle(otherTeams)) {
    if (out.length >= 3) break;
    tryAdd(other, false);
  }

  // Fallback: se non bastano (poche squadre/ruoli), consenti il riuso.
  let guard = 0;
  while (out.length < 3 && otherTeams.length > 0 && guard < 30) {
    guard++;
    tryAdd(pick(otherTeams), true);
  }

  return out;
}
