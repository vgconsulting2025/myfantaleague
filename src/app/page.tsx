import { getLeagueRepository } from "@/lib/league/repository";
import AppShell from "@/components/AppShell";

// Legge sempre dati freschi dal DB (le mutazioni via API route + router.refresh()
// devono riflettersi immediatamente).
export const dynamic = "force-dynamic";

export default async function Home() {
  const repo = getLeagueRepository();

  const [userTeam, standings, editions, trades, flash, latestGiornata] = await Promise.all([
    repo.getUserTeam(),
    repo.getStandings(),
    repo.getEditions(),
    repo.getTrades(),
    repo.getFlashNews(8),
    repo.getLatestGiornata(),
  ]);

  // Modalità demo attiva quando manca la chiave API (contenuti da template locali).
  const demoMode = !process.env.ANTHROPIC_API_KEY?.trim();

  return (
    <AppShell
      userTeam={userTeam}
      standings={standings}
      editions={editions}
      trades={trades}
      flash={flash}
      latestGiornata={latestGiornata}
      demoMode={demoMode}
    />
  );
}
