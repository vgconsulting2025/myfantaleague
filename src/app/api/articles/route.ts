import { NextResponse } from "next/server";
import { getLeagueRepository } from "@/lib/league/repository";
import { askClaude, hasAnthropicKey, parseAiJson } from "@/lib/anthropic";
import { generateDemoArticles } from "@/lib/league/demo-content";
import type { ArticleInput } from "@/lib/league/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/articles — "Genera l'edizione del giorno"
// Costruisce il contesto (classifica + risultati ultima giornata + scambi
// recenti) e chiede all'AI 4-6 articoli in JSON. Salva l'edizione nel DB.
export async function POST() {
  const repo = getLeagueRepository();

  try {
    const [standingsArr, latest, recentTrades] = await Promise.all([
      repo.getStandings(),
      repo.getLatestGiornata(),
      repo.getTrades(),
    ]);
    const coachRatings = latest ? await repo.getCoachRatingsForGiornata(latest.number) : [];

    // Modalità demo: nessuna chiave API → articoli da template locali.
    if (!hasAnthropicKey()) {
      const demoArticles = generateDemoArticles({
        standings: standingsArr,
        latest,
        trades: recentTrades,
        coachRatings,
      });
      if (demoArticles.length === 0) throw new Error("Nessun articolo generato");
      const edition = await repo.saveEdition(demoArticles, latest?.number ?? 1);
      return NextResponse.json({ edition, demo: true });
    }

    const standings = standingsArr
      .map((t, i) => `${i + 1}. ${t.name} (pres. ${t.president}) — ${t.points} punti`)
      .join("\n");

    const results = latest
      ? latest.results
          .map((r) => `${r.home} vs ${r.away}: ${r.homeScore} - ${r.awayScore}. ${r.note}`)
          .join("\n")
      : "Nessuna partita giocata di recente.";

    const trades = recentTrades.slice(0, 5).length
      ? recentTrades
          .slice(0, 5)
          .map((t) =>
            t.status === "accepted"
              ? `UFFICIALE: ${t.fromTeam} ha ceduto ${t.giveName} a ${t.toTeam} per ${t.receiveName}.`
              : `SALTATO: ${t.fromTeam} ha rifiutato lo scambio ${t.giveName} ↔ ${t.receiveName} con ${t.toTeam}.`,
          )
          .join("\n")
      : "Nessuno scambio recente.";

    const giornataNum = latest?.number ?? 1;

    const panchine = coachRatings.length
      ? coachRatings
          .slice()
          .sort((a, b) => a.score - b.score)
          .map(
            (c) =>
              `${c.president && c.president !== "—" ? c.president : c.teamName}: ${c.score}/10 — ${c.comment}`,
          )
          .join("\n")
      : "Nessun voto agli allenatori.";

    const prompt = `Sei il redattore capo della gazzetta di una lega di fantacalcio italiana chiamata "Lega Bar Centrale". Scrivi con tono da quotidiano sportivo italiano: ironico, epico, con soprannomi e drammi da bar.

CLASSIFICA:
${standings}

RISULTATI GIORNATA ${giornataNum}:
${results}

MERCATO RECENTE:
${trades}

VOTI AGLI ALLENATORI (dal peggiore al migliore):
${panchine}

Genera da 4 a 6 articoli sulla giornata, sul mercato e sui voti agli allenatori. Rispondi SOLO con JSON valido, nessun testo prima o dopo, nessun markdown. Formato:
[{"kicker":"occhiello breve","title":"titolo a effetto","body":"articolo di 60-90 parole","category":"CRONACA|PAGELLE|POLEMICHE|SPOGLIATOIO|MERCATO|PANCHINE"}]
Il primo articolo è il pezzo di apertura sul risultato più clamoroso della giornata. Includi SEMPRE un articolo con category "PANCHINE" che sbeffeggia chi ha sbagliato la formazione (gioielli in panchina, titolari flop).`;

    const raw = await askClaude(prompt, 2500);
    const parsed = parseAiJson<unknown>(raw);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("Formato articoli non valido");
    }

    const articles: ArticleInput[] = parsed
      .filter(
        (a): a is Record<string, unknown> =>
          !!a && typeof a === "object" && typeof (a as Record<string, unknown>).title === "string",
      )
      .map((a) => ({
        kicker: String(a.kicker ?? ""),
        title: String(a.title ?? ""),
        body: String(a.body ?? ""),
        category: String(a.category ?? "CRONACA").toUpperCase(),
      }))
      .filter((a) => a.title.trim() !== "" && a.body.trim() !== "");

    if (articles.length === 0) throw new Error("Nessun articolo valido nella risposta");

    const edition = await repo.saveEdition(articles, giornataNum);
    return NextResponse.json({ edition, demo: false });
  } catch (err) {
    console.error("[/api/articles]", err);
    const message =
      err instanceof Error && err.message.includes("ANTHROPIC_API_KEY")
        ? err.message
        : "La redazione è in sciopero (errore di generazione). Riprova.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
