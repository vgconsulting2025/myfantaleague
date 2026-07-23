// Template PURI (goliardici) degli articoli di mercato: proposta ed esito, sia
// per gli scambi tra squadre sia per gli scambi con gli svincolati. Usati per
// creare notizie della Gazzetta al volo (indipendenti dall'AI). Testabile.

import type { ArticleInput } from "./types";
import { IDOL_LEVEL_META, type IdolLevel } from "./idol";
import { derbyOutcome, type RivalCounters } from "./rival";

function pick<T>(a: T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}

export interface SquadProposalLite {
  give: string;
  receive: string;
  otherTeam: string;
}

// Annuncio: l'Agente ha proposto scambi tra squadre.
export function announceSquadTrade(
  proposals: SquadProposalLite[],
  userTeamName: string,
): ArticleInput {
  const p = proposals[0];
  const n = proposals.length;
  return {
    kicker: "L'Agente si muove",
    category: "MERCATO",
    title: pick([
      `Proposta indecente tra ${userTeamName} e ${p.otherTeam}`,
      `Fuochi d'artificio: ${userTeamName} tenta lo scambio con ${p.otherTeam}`,
      `Telefoni roventi tra ${userTeamName} e ${p.otherTeam}`,
    ]),
    body: `L'Agente mette sul tavolo ${n} propost${n > 1 ? "e" : "a"}: la più ghiotta manda ${p.give} a ${p.otherTeam} in cambio di ${p.receive}. ${pick(
      ["Il bar è in fermento.", "I presidenti sudano freddo.", "Trattativa da romanzo."],
    )}`,
  };
}

// Esito di uno scambio tra squadre.
export function outcomeSquadTrade(
  userTeamName: string,
  otherTeam: string,
  give: string,
  receive: string,
  accepted: boolean,
): ArticleInput {
  if (accepted) {
    return {
      kicker: "Ufficiale",
      category: "MERCATO",
      title: pick([
        `Affare fatto: ${receive} sbarca a ${userTeamName}`,
        `${userTeamName} chiude: dentro ${receive}, fuori ${give}`,
      ]),
      body: `${userTeamName} cede ${give} a ${otherTeam} e accoglie ${receive}. ${pick([
        "L'Agente incassa la commissione.",
        "Colpo che può cambiare la stagione.",
        "Stretta di mano e via.",
      ])}`,
    };
  }
  return {
    kicker: "Fumata nera",
    category: "MERCATO",
    title: pick([
      `Salta tutto: ${userTeamName} dice no a ${otherTeam}`,
      `Niente ${receive}: ${userTeamName} chiude la porta`,
    ]),
    body: `Il presidente di ${userTeamName} rispedisce al mittente lo scambio ${give} ↔ ${receive} con ${otherTeam}. ${pick(
      ["Se ne riparla.", "Trattativa rimandata.", "Orgoglio salvo, rosa invariata."],
    )}`,
  };
}

// Annuncio: l'Agente propone uno scambio con uno svincolato.
export function announceFreeAgent(
  teamName: string,
  giveName: string,
  faName: string,
  faClub: string,
): ArticleInput {
  return {
    kicker: "Mercato svincolati",
    category: "SVINCOLATI",
    title: pick([
      `Colpo dagli svincolati: ${faName} verso ${teamName}?`,
      `L'Agente pesca dagli svincolati: ${faName} offerto a ${teamName}`,
      `${teamName} tentata: ${faName} (ex ${faClub}) bussa alla porta`,
    ]),
    body: `L'Agente propone a ${teamName} di liberare ${giveName} per fare spazio allo svincolato ${faName} (ex ${faClub}). ${pick(
      ["Occasione o trappola?", "Il presidente ci pensa.", "Affare last-minute in vista."],
    )}`,
  };
}

// Esito di uno scambio con uno svincolato.
export function outcomeFreeAgent(
  teamName: string,
  giveName: string,
  faName: string,
  accepted: boolean,
): ArticleInput {
  if (accepted) {
    return {
      kicker: "Ufficiale",
      category: "SVINCOLATI",
      title: pick([
        `${faName} non è più svincolato: preso da ${teamName}`,
        `${teamName} accoglie ${faName}, ${giveName} torna sul mercato`,
      ]),
      body: `Scambio con gli svincolati concluso: ${teamName} tessera ${faName} e libera ${giveName}. ${pick(
        ["L'Agente sorride.", "Rosa rinnovata.", "Mossa a sorpresa."],
      )}`,
    };
  }
  return {
    kicker: "Rifiutato",
    category: "SVINCOLATI",
    title: pick([
      `${teamName} dice no allo svincolato ${faName}`,
      `Niente da fare: ${faName} resta svincolato`,
    ]),
    body: `Il presidente di ${teamName} rinuncia allo scambio con ${faName}. ${pick([
      "Fiducia nella rosa attuale.",
      "Trattativa naufragata.",
      "Se ne riparla.",
    ])}`,
  };
}

// Annuncio: un presidente designa (o cambia) l'idolo della propria squadra.
export function announceIdol(teamName: string, playerName: string): ArticleInput {
  return {
    kicker: "Nuovo idolo",
    category: "IDOLO",
    title: pick([
      `${teamName} ha un nuovo eroe: ${playerName} è l'idolo della squadra`,
      `${playerName} incoronato: è lui l'idolo del ${teamName}`,
      `Colpo di scena a ${teamName}: ${playerName} eletto idolo`,
    ]),
    body: `Il presidente del ${teamName} designa ${playerName} come idolo della squadra. ${pick([
      "La curva è già in delirio.",
      "Ora tocca a lui trascinare tutti.",
      "Aspettative alle stelle, guai a deludere.",
      "Maglia sudata garantita, o quasi.",
    ])}`,
  };
}

const LEVEL_PHRASE: Record<IdolLevel, string> = {
  1: "di Bronzo",
  2: "d'Argento",
  3: "Verde",
  4: "Leggenda",
};

// Annuncio: l'idolo di una squadra sale a un livello superiore. Distinto
// dall'articolo di designazione.
export function announceIdolLevelUp(
  teamName: string,
  playerName: string,
  level: IdolLevel,
): ArticleInput {
  const phrase = LEVEL_PHRASE[level];
  const label = IDOL_LEVEL_META[level].label;
  return {
    kicker: "Salita di livello",
    category: "IDOLO",
    title: pick([
      `${playerName} è ufficialmente un Idolo ${phrase} per il ${teamName}!`,
      `${teamName} sugli scudi: ${playerName} raggiunge il livello ${label}`,
      `Nuova gloria: ${playerName} promosso Idolo ${phrase} del ${teamName}`,
    ]),
    body: `${playerName} sale al livello ${label} nella scala degli idoli del ${teamName}. ${pick([
      "La bacheca si illumina.",
      "Il pubblico canta il suo nome.",
      "Cornice nuova, ambizioni immutate.",
      "Un altro gradino verso la leggenda.",
    ])}`,
  };
}

// Articolo speciale del DERBY: quando la tua squadra affronta il rivale storico.
// Tono acceso, richiama la rivalità e il computo storico degli scontri. `record`
// è lo storico GIÀ aggiornato con questo derby.
export function derbyArticle(
  userTeam: string,
  rivalTeam: string,
  userScore: number,
  rivalScore: number,
  record: RivalCounters,
): ArticleInput {
  const o = derbyOutcome(userScore, rivalScore);
  const scoreLine = `${userTeam} ${userScore.toFixed(1)} - ${rivalScore.toFixed(1)} ${rivalTeam}`;
  const title =
    o === "win"
      ? pick([
          `Derby ai ${userTeam}: ${rivalTeam} al tappeto`,
          `${userTeam} domina il derby con ${rivalTeam}`,
        ])
      : o === "loss"
        ? pick([
            `Beffa nel derby: ${rivalTeam} passa sul ${userTeam}`,
            `${rivalTeam} sbanca il derby contro ${userTeam}`,
          ])
        : pick([
            `Derby diviso: ${userTeam} e ${rivalTeam} non si fanno male`,
            `Pari e nervi tesi nel derby ${userTeam}-${rivalTeam}`,
          ]);
  return {
    kicker: "Derby",
    category: "DERBY",
    title,
    body: `${scoreLine}. ${pick([
      "Rivalità di sempre.",
      "Sfida sentitissima, come da tradizione.",
      "Il derby non tradisce mai le attese.",
    ])} Nella storia della sfida col rivale: ${record.wins}V ${record.draws}N ${record.losses}P per ${userTeam}, ${record.pointsFor.toFixed(1)}-${record.pointsAgainst.toFixed(1)} il totale in ${record.derbies} derby.`,
  };
}
