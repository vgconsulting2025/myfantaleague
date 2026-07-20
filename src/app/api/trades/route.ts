import { NextResponse } from "next/server";
import { getLeagueRepository } from "@/lib/league/repository";
import { askClaude, hasAnthropicKey, parseAiJson } from "@/lib/anthropic";
import { validateProposals } from "@/lib/league/trades";
import { generateDemoProposals } from "@/lib/league/demo-content";
import type { LeagueTeam, TradeProposal } from "@/lib/league/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function rosterText(team: LeagueTeam): string {
  return team.players
    .map((p) => `${p.name} (${p.role}, ${p.club}, quota ${p.quota}, fantamedia ${p.fm})`)
    .join("; ");
}

// POST /api/trades — "Chiama l'Agente"
// Invia le rose all'AI, riceve 3 proposte, le valida lato server (i giocatori
// devono esistere davvero nelle rose indicate) e restituisce solo quelle valide.
export async function POST() {
  const repo = getLeagueRepository();

  try {
    const teams = await repo.getTeams();
    const userTeam = teams.find((t) => t.isUser);
    if (!userTeam) throw new Error("Squadra dell'utente non trovata");
    const others = teams.filter((t) => !t.isUser);

    // Modalità demo: nessuna chiave API → proposte da template locali sui dati reali.
    if (!hasAnthropicKey()) {
      const demo = generateDemoProposals(userTeam, others);
      const proposals = validateProposals(demo, userTeam, others);
      if (proposals.length === 0) throw new Error("Nessuna proposta generata");
      return NextResponse.json({ proposals, demo: true });
    }

    const othersText = others
      .map((t) => `SQUADRA "${t.name}" (presidente ${t.president}): ${rosterText(t)}`)
      .join("\n");

    const prompt = `Sei l'Agente di mercato di una lega di fantacalcio italiana. Analizzi le rose e proponi scambi credibili ed equilibrati tra la squadra dell'utente e le altre.

ROSA DELL'UTENTE "${userTeam.name}": ${rosterText(userTeam)}

ALTRE SQUADRE:
${othersText}

Proponi 3 scambi (1 giocatore per 1 giocatore, stesso ruolo o valore simile) che abbiano senso per ENTRAMBE le squadre. Usa SOLO giocatori presenti nelle rose, con i nomi ESATTI così come scritti sopra. Rispondi SOLO con JSON valido, nessun altro testo:
[{"otherTeam":"nome esatto squadra","give":"giocatore che l'utente cede","receive":"giocatore che l'utente riceve","rationale":"perché conviene a entrambi, 25-40 parole","agentComment":"battuta da procuratore navigato, max 15 parole"}]`;

    const raw = await askClaude(prompt, 1500);
    const parsed = parseAiJson<unknown>(raw);
    if (!Array.isArray(parsed)) throw new Error("Formato proposte non valido");

    const proposals = validateProposals(parsed as TradeProposal[], userTeam, others);
    if (proposals.length === 0) throw new Error("Nessuna proposta valida");

    return NextResponse.json({ proposals, demo: false });
  } catch (err) {
    console.error("[/api/trades]", err);
    const message =
      err instanceof Error && err.message.includes("ANTHROPIC_API_KEY")
        ? err.message
        : "L'Agente ha perso il telefono (errore di generazione). Riprova.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
