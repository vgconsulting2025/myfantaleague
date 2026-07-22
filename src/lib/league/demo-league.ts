// Dataset della lega dimostrativa, condiviso tra lo script di seed
// (prisma/seed.ts) e la funzione "Ripristina lega demo" del repository.
import type { Role } from "./types";

export interface DemoPlayer {
  name: string;
  role: Role;
  club: string;
  quota: number;
  fm: number;
}

export interface DemoTeam {
  slug: string;
  name: string;
  president: string;
  points: number;
  isUser?: boolean;
  players: DemoPlayer[];
}

export interface DemoResult {
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  note: string;
}

export const DEMO_TEAMS: DemoTeam[] = [
  {
    slug: "divano",
    name: "Real Divano",
    president: "Tu",
    points: 12,
    isUser: true,
    players: [
      { name: "Sommer", role: "P", club: "Inter", quota: 16, fm: 6.1 },
      { name: "Di Gregorio", role: "P", club: "Juventus", quota: 15, fm: 6.0 },
      { name: "Falcone", role: "P", club: "Lecce", quota: 10, fm: 5.9 },
      { name: "Bastoni", role: "D", club: "Inter", quota: 22, fm: 6.4 },
      { name: "Bremer", role: "D", club: "Juventus", quota: 18, fm: 6.2 },
      { name: "Dimarco", role: "D", club: "Inter", quota: 24, fm: 6.9 },
      { name: "Dodo", role: "D", club: "Fiorentina", quota: 15, fm: 6.5 },
      { name: "Gatti", role: "D", club: "Juventus", quota: 13, fm: 6.1 },
      { name: "Barella", role: "C", club: "Inter", quota: 30, fm: 6.8 },
      { name: "Koopmeiners", role: "C", club: "Juventus", quota: 26, fm: 6.3 },
      { name: "Fagioli", role: "C", club: "Juventus", quota: 16, fm: 6.2 },
      { name: "Frattesi", role: "C", club: "Inter", quota: 18, fm: 6.4 },
      { name: "Lautaro", role: "A", club: "Inter", quota: 42, fm: 7.4 },
      { name: "Kean", role: "A", club: "Fiorentina", quota: 28, fm: 7.0 },
      { name: "Zapata", role: "A", club: "Torino", quota: 20, fm: 6.5 },
    ],
  },
  {
    slug: "sciacallo",
    name: "AC Sciacallo",
    president: "Marco",
    points: 15,
    players: [
      { name: "Maignan", role: "P", club: "Milan", quota: 17, fm: 6.2 },
      { name: "Carnesecchi", role: "P", club: "Atalanta", quota: 13, fm: 6.1 },
      { name: "Provedel", role: "P", club: "Lazio", quota: 12, fm: 6.0 },
      { name: "Pavard", role: "D", club: "Inter", quota: 15, fm: 6.1 },
      { name: "Buongiorno", role: "D", club: "Napoli", quota: 16, fm: 6.3 },
      { name: "Cambiaso", role: "D", club: "Juventus", quota: 17, fm: 6.4 },
      { name: "Tomori", role: "D", club: "Milan", quota: 12, fm: 6.0 },
      { name: "Di Lorenzo", role: "D", club: "Napoli", quota: 16, fm: 6.3 },
      { name: "Pulisic", role: "C", club: "Milan", quota: 34, fm: 7.2 },
      { name: "Zaccagni", role: "C", club: "Lazio", quota: 24, fm: 6.7 },
      { name: "Loftus-Cheek", role: "C", club: "Milan", quota: 18, fm: 6.2 },
      { name: "Ederson", role: "C", club: "Atalanta", quota: 20, fm: 6.5 },
      { name: "Retegui", role: "A", club: "Atalanta", quota: 34, fm: 7.3 },
      { name: "Thuram", role: "A", club: "Inter", quota: 36, fm: 7.1 },
      { name: "Beltran", role: "A", club: "Fiorentina", quota: 16, fm: 6.1 },
    ],
  },
  {
    slug: "polleria",
    name: "Sportiva Polleria",
    president: "Giulia",
    points: 9,
    players: [
      { name: "Svilar", role: "P", club: "Roma", quota: 14, fm: 6.4 },
      { name: "Meret", role: "P", club: "Napoli", quota: 14, fm: 6.1 },
      { name: "Montipò", role: "P", club: "Hellas Verona", quota: 10, fm: 5.9 },
      { name: "Bijol", role: "D", club: "Udinese", quota: 12, fm: 6.0 },
      { name: "Nuno Tavares", role: "D", club: "Lazio", quota: 18, fm: 6.8 },
      { name: "Angelino", role: "D", club: "Roma", quota: 15, fm: 6.4 },
      { name: "Kalulu", role: "D", club: "Juventus", quota: 13, fm: 6.1 },
      { name: "Scalvini", role: "D", club: "Atalanta", quota: 12, fm: 6.0 },
      { name: "Reijnders", role: "C", club: "Milan", quota: 25, fm: 6.9 },
      { name: "Anguissa", role: "C", club: "Napoli", quota: 20, fm: 6.5 },
      { name: "Baldanzi", role: "C", club: "Roma", quota: 14, fm: 6.1 },
      { name: "Ricci", role: "C", club: "Torino", quota: 16, fm: 6.2 },
      { name: "Vlahovic", role: "A", club: "Juventus", quota: 34, fm: 6.7 },
      { name: "Lucca", role: "A", club: "Udinese", quota: 20, fm: 6.4 },
      { name: "Dovbyk", role: "A", club: "Roma", quota: 30, fm: 6.8 },
    ],
  },
  {
    slug: "monaci",
    name: "Bayern Monaci",
    president: "Andrea",
    points: 13,
    players: [
      { name: "Skorupski", role: "P", club: "Bologna", quota: 12, fm: 6.0 },
      { name: "Terracciano", role: "P", club: "Fiorentina", quota: 10, fm: 5.9 },
      { name: "Okoye", role: "P", club: "Udinese", quota: 11, fm: 6.0 },
      { name: "Gila", role: "D", club: "Lazio", quota: 12, fm: 6.1 },
      { name: "Thiaw", role: "D", club: "Milan", quota: 11, fm: 5.9 },
      { name: "Bellanova", role: "D", club: "Atalanta", quota: 14, fm: 6.3 },
      { name: "Dumfries", role: "D", club: "Inter", quota: 16, fm: 6.5 },
      { name: "Celik", role: "D", club: "Roma", quota: 10, fm: 5.9 },
      { name: "McTominay", role: "C", club: "Napoli", quota: 28, fm: 7.1 },
      { name: "Orsolini", role: "C", club: "Bologna", quota: 26, fm: 7.0 },
      { name: "Soulé", role: "C", club: "Roma", quota: 22, fm: 6.6 },
      { name: "Pellegrini", role: "C", club: "Roma", quota: 20, fm: 6.3 },
      { name: "Dybala", role: "A", club: "Roma", quota: 30, fm: 6.9 },
      { name: "Lookman", role: "A", club: "Atalanta", quota: 32, fm: 7.1 },
      { name: "Krstovic", role: "A", club: "Lecce", quota: 18, fm: 6.3 },
    ],
  },
  {
    slug: "sbronza",
    name: "Atletico Sbronza",
    president: "Luca",
    points: 11,
    players: [
      { name: "De Gea", role: "P", club: "Fiorentina", quota: 14, fm: 6.3 },
      { name: "Milinkovic-Savic", role: "P", club: "Torino", quota: 12, fm: 6.1 },
      { name: "Suzuki", role: "P", club: "Parma", quota: 10, fm: 5.9 },
      { name: "Theo Hernandez", role: "D", club: "Milan", quota: 20, fm: 6.6 },
      { name: "Rrahmani", role: "D", club: "Napoli", quota: 12, fm: 6.1 },
      { name: "Savona", role: "D", club: "Juventus", quota: 10, fm: 5.9 },
      { name: "Posch", role: "D", club: "Bologna", quota: 10, fm: 5.9 },
      { name: "Biraghi", role: "D", club: "Fiorentina", quota: 12, fm: 6.1 },
      { name: "Calhanoglu", role: "C", club: "Inter", quota: 28, fm: 6.9 },
      { name: "Fabbian", role: "C", club: "Bologna", quota: 14, fm: 6.2 },
      { name: "Bennacer", role: "C", club: "Milan", quota: 16, fm: 6.2 },
      { name: "Folorunsho", role: "C", club: "Napoli", quota: 12, fm: 6.0 },
      { name: "Castellanos", role: "A", club: "Lazio", quota: 22, fm: 6.5 },
      { name: "Thauvin", role: "A", club: "Udinese", quota: 20, fm: 6.4 },
      { name: "Simeone", role: "A", club: "Napoli", quota: 16, fm: 6.2 },
    ],
  },
  {
    slug: "cinghiale",
    name: "Deportivo Cinghiale",
    president: "Sara",
    points: 8,
    players: [
      { name: "Perin", role: "P", club: "Juventus", quota: 10, fm: 6.0 },
      { name: "Musso", role: "P", club: "Atalanta", quota: 10, fm: 5.9 },
      { name: "Leali", role: "P", club: "Genoa", quota: 11, fm: 6.0 },
      { name: "De Vrij", role: "D", club: "Inter", quota: 12, fm: 6.1 },
      { name: "Coppola", role: "D", club: "Hellas Verona", quota: 10, fm: 5.9 },
      { name: "Comuzzo", role: "D", club: "Fiorentina", quota: 11, fm: 6.1 },
      { name: "Zappacosta", role: "D", club: "Atalanta", quota: 13, fm: 6.2 },
      { name: "Djimsiti", role: "D", club: "Atalanta", quota: 10, fm: 5.9 },
      { name: "Nico Paz", role: "C", club: "Como", quota: 20, fm: 6.6 },
      { name: "Koné", role: "C", club: "Roma", quota: 16, fm: 6.2 },
      { name: "Samardzic", role: "C", club: "Atalanta", quota: 18, fm: 6.3 },
      { name: "Zielinski", role: "C", club: "Inter", quota: 16, fm: 6.2 },
      { name: "Raspadori", role: "A", club: "Napoli", quota: 18, fm: 6.3 },
      { name: "Cambiaghi", role: "A", club: "Empoli", quota: 14, fm: 6.1 },
      { name: "Piccoli", role: "A", club: "Cagliari", quota: 16, fm: 6.2 },
    ],
  },
];

export const DEMO_GIORNATA: { number: number; results: DemoResult[] } = {
  number: 1,
  results: [
    {
      home: "Real Divano",
      away: "AC Sciacallo",
      homeScore: 68.5,
      awayScore: 74,
      note: "Doppietta di Retegui, Lautaro sottotono (5.5). Sommer para un rigore ma non basta.",
    },
    {
      home: "Sportiva Polleria",
      away: "Bayern Monaci",
      homeScore: 71,
      awayScore: 70.5,
      note: "Vittoria al fotofinish: gol di Vlahovic al 90'. McTominay 7.5 non basta ai Monaci.",
    },
    {
      home: "Atletico Sbronza",
      away: "Deportivo Cinghiale",
      homeScore: 66,
      awayScore: 66,
      note: "Pari d'altri tempi: Calhanoglu spreca un rigore, Nico Paz illumina ma non punge.",
    },
  ],
};

export const DEMO_FLASH =
  "Mercato aperto: l'Agente è già al lavoro sulle rose della Lega Bar Centrale.";

// Giocatori svincolati (non assegnati a nessuna squadra).
export const DEMO_FREE_AGENTS: DemoPlayer[] = [
  { name: "Gollini", role: "P", club: "Roma", quota: 8, fm: 5.9 },
  { name: "Kayode", role: "D", club: "Fiorentina", quota: 9, fm: 6.0 },
  { name: "Zortea", role: "D", club: "Cagliari", quota: 9, fm: 6.1 },
  { name: "Sohm", role: "C", club: "Parma", quota: 12, fm: 6.2 },
  { name: "Colpani", role: "C", club: "Monza", quota: 16, fm: 6.4 },
  { name: "Vranckx", role: "C", club: "Milan", quota: 10, fm: 6.0 },
  { name: "Pinamonti", role: "A", club: "Genoa", quota: 16, fm: 6.4 },
  { name: "Colombo", role: "A", club: "Empoli", quota: 12, fm: 6.1 },
];
