// Parsing PURO e tollerante di dati tabellari (CSV / TSV / testo incollato).
// Nessuna dipendenza esterna: gli export delle piattaforme variano, quindi qui
// si normalizzano intestazioni, ruoli e numeri, segnalando i problemi come
// warning invece di fallire (l'utente corregge in anteprima).

import type { Role } from "../types";
import type {
  CalendarPreview,
  ImportPlayerRow,
  ImportResultRow,
  RosterPreview,
} from "./types";

/* ---------------- Tabular parsing ---------------- */

export function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/).find((l) => l.trim() !== "") ?? "";
  const count = (d: string) => (firstLine.match(new RegExp(escapeRe(d), "g")) || []).length;
  const candidates: [string, number][] = [
    ["\t", count("\t")],
    [";", count(";")],
    [",", count(",")],
  ];
  const best = candidates.reduce((a, b) => (b[1] > a[1] ? b : a));
  return best[1] > 0 ? best[0] : ",";
}

// Parser CSV con supporto a virgolette (campi con delimitatore/virgolette interne).
export function parseDelimited(text: string, delimiter?: string): string[][] {
  const delim = delimiter ?? detectDelimiter(text);
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    cur.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    rows.push(cur);
    cur = [];
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delim) {
      pushField();
    } else if (c === "\n") {
      pushRow();
    } else if (c === "\r") {
      // ignorato (gestisce \r\n)
    } else {
      field += c;
    }
  }
  if (field !== "" || cur.length > 0) pushRow();

  // Scarta righe completamente vuote.
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/* ---------------- Helpers ---------------- */

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Combining diacritical marks U+0300–U+036F (costruito via new RegExp per evitare
// caratteri combinanti letterali nel sorgente).
const DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .replace(/[._]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface FieldSyn {
  field: string;
  syns: string[];
}

// Mappa le colonne ai campi attesi: prima match esatti, poi match "a parola intera"
// (evita che sinonimi corti come "casa" catturino colonne sbagliate).
function mapColumns(header: string[], fields: FieldSyn[]): Record<string, number> {
  const normHeader = header.map(norm);
  const used = new Set<number>();
  const result: Record<string, number> = {};

  const exact = (i: number, syns: string[]) => syns.some((s) => normHeader[i] === s);
  const word = (i: number, syns: string[]) =>
    syns.some((s) => s.length >= 3 && new RegExp(`\\b${escapeRe(s)}\\b`).test(normHeader[i]));

  for (const { field, syns } of fields) {
    for (let i = 0; i < normHeader.length; i++) {
      if (used.has(i)) continue;
      if (exact(i, syns)) {
        result[field] = i;
        used.add(i);
        break;
      }
    }
  }
  for (const { field, syns } of fields) {
    if (field in result) continue;
    for (let i = 0; i < normHeader.length; i++) {
      if (used.has(i)) continue;
      if (word(i, syns)) {
        result[field] = i;
        used.add(i);
        break;
      }
    }
  }
  return result;
}

export function normalizeRole(raw: string): Role | "?" {
  const r = norm(raw);
  if (!r) return "?";
  const classic: Record<string, Role> = {
    p: "P", por: "P", portiere: "P", gk: "P",
    d: "D", dif: "D", difensore: "D",
    c: "C", cen: "C", centrocampista: "C", mid: "C",
    a: "A", att: "A", attaccante: "A",
  };
  if (classic[r]) return classic[r];
  // Ruoli Mantra → classico (approssimazione, correggibile in anteprima).
  const mantra: Record<string, Role> = {
    dc: "D", dd: "D", ds: "D", b: "D",
    e: "C", m: "C", w: "C", t: "C",
    pc: "A",
  };
  if (mantra[r]) return mantra[r];
  const first = r[0]?.toUpperCase();
  if (first === "P" || first === "D" || first === "C" || first === "A") return first as Role;
  return "?";
}

function parseNumber(raw: string): number | null {
  if (raw == null) return null;
  const cleaned = String(raw).replace(/[^0-9,.-]/g, "").replace(",", ".");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function splitResult(s: string): [number | null, number | null] {
  const m = s.match(/(-?\d+(?:[.,]\d+)?)\s*[-–:]\s*(-?\d+(?:[.,]\d+)?)/);
  if (!m) return [null, null];
  return [Number(m[1].replace(",", ".")), Number(m[2].replace(",", "."))];
}

/* ---------------- Interpretazione rose ---------------- */

const ROSTER_FIELDS: FieldSyn[] = [
  { field: "name", syns: ["giocatore", "nome", "calciatore", "player", "nominativo"] },
  { field: "role", syns: ["ruolo", "pos", "posizione", "role"] },
  { field: "quota", syns: ["quotazione", "quota", "costo", "prezzo", "valore", "crediti"] },
  { field: "fm", syns: ["fantamedia", "fm", "media voto", "media", "mv"] },
  { field: "club", syns: ["club", "squadra serie a", "serie a", "squadra reale", "reale"] },
  {
    field: "team",
    syns: [
      "fantasquadra", "fanta squadra", "fantateam", "fanta team",
      "proprietario", "allenatore", "rosa", "squadra", "team",
    ],
  },
];

export function interpretRoster(rows: string[][]): RosterPreview {
  const warnings: string[] = [];
  if (rows.length < 2) {
    return { kind: "roster", players: [], teams: [], warnings: ["Nessuna riga di dati trovata."], mapping: {} };
  }
  const header = rows[0];
  const map = mapColumns(header, ROSTER_FIELDS);
  const mapping: Record<string, string> = {};
  for (const k of Object.keys(map)) mapping[k] = header[map[k]];

  if (map.name === undefined) {
    return {
      kind: "roster",
      players: [],
      teams: [],
      warnings: [`Colonna "giocatore" non riconosciuta. Intestazioni viste: ${header.join(", ")}`],
      mapping,
    };
  }

  const hasTeamCol = map.team !== undefined;
  const players: ImportPlayerRow[] = [];
  let groupTeam = ""; // per il formato "raggruppato" (riga-titolo con solo la squadra)

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const get = (f: string) => (map[f] !== undefined ? (row[map[f]] ?? "").trim() : "");

    if (!hasTeamCol) {
      const nonEmpty = row.filter((c) => c && c.trim() !== "");
      if (nonEmpty.length === 1) {
        groupTeam = nonEmpty[0].trim();
        continue;
      }
    }

    const name = get("name");
    if (!name) continue;
    const team = hasTeamCol ? get("team") : groupTeam;
    if (!team) warnings.push(`Riga ${i + 1}: squadra mancante per "${name}".`);

    const role = normalizeRole(get("role"));
    if (role === "?") warnings.push(`Riga ${i + 1}: ruolo non riconosciuto per "${name}" ("${get("role")}").`);

    const q = parseNumber(get("quota"));
    if (map.quota !== undefined && q === null) warnings.push(`Riga ${i + 1}: quotazione non numerica per "${name}".`);
    const fm = parseNumber(get("fm"));

    players.push({
      team: team || "Senza squadra",
      name,
      role,
      club: get("club"),
      quota: q !== null ? Math.round(q) : 0,
      fm: fm !== null ? fm : 6.0,
    });
  }

  if (!players.length) warnings.push("Nessun giocatore riconosciuto: controlla il formato del file.");
  const teams = Array.from(new Set(players.map((p) => p.team)));
  return { kind: "roster", players, teams, warnings: warnings.slice(0, 60), mapping };
}

/* ---------------- Interpretazione calendario ---------------- */

const CALENDAR_FIELDS: FieldSyn[] = [
  { field: "giornata", syns: ["giornata", "gg", "turno", "matchday", "giorno"] },
  { field: "home", syns: ["squadra casa", "padrona di casa", "in casa", "casa", "home"] },
  { field: "away", syns: ["squadra ospite", "fuori casa", "ospite", "trasferta", "fuori", "away"] },
  { field: "homeScore", syns: ["punti casa", "gol casa", "casa punti", "fantapunti casa", "score casa"] },
  { field: "awayScore", syns: ["punti ospite", "gol ospite", "ospite punti", "fantapunti ospite", "score ospite"] },
  { field: "result", syns: ["risultato", "punteggio", "score"] },
  { field: "note", syns: ["note", "nota", "commento", "descrizione"] },
];

export function interpretCalendar(rows: string[][]): CalendarPreview {
  const warnings: string[] = [];
  if (rows.length < 2) {
    return { kind: "calendar", results: [], warnings: ["Nessuna riga di dati trovata."], mapping: {} };
  }
  const header = rows[0];
  const map = mapColumns(header, CALENDAR_FIELDS);
  const mapping: Record<string, string> = {};
  for (const k of Object.keys(map)) mapping[k] = header[map[k]];

  if (map.home === undefined || map.away === undefined) {
    return {
      kind: "calendar",
      results: [],
      warnings: [`Colonne "squadra casa"/"squadra ospite" non riconosciute. Intestazioni viste: ${header.join(", ")}`],
      mapping,
    };
  }

  const results: ImportResultRow[] = [];
  let lastGiornata = 1;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const get = (f: string) => (map[f] !== undefined ? (row[map[f]] ?? "").trim() : "");
    const home = get("home");
    const away = get("away");
    if (!home || !away) continue;

    let hs = map.homeScore !== undefined ? parseNumber(get("homeScore")) : null;
    let as = map.awayScore !== undefined ? parseNumber(get("awayScore")) : null;
    if ((hs === null || as === null) && map.result !== undefined) {
      const [a, b] = splitResult(get("result"));
      if (hs === null) hs = a;
      if (as === null) as = b;
    }
    if (hs === null || as === null) warnings.push(`Riga ${i + 1}: punteggio non riconosciuto per ${home}-${away}.`);

    const g = parseNumber(get("giornata"));
    const giornata = g !== null ? Math.round(g) : lastGiornata;
    lastGiornata = giornata;

    results.push({
      giornata,
      home,
      away,
      homeScore: hs ?? 0,
      awayScore: as ?? 0,
      note: get("note"),
    });
  }

  if (!results.length) warnings.push("Nessuna partita riconosciuta: controlla il formato del file.");
  return { kind: "calendar", results, warnings: warnings.slice(0, 60), mapping };
}
