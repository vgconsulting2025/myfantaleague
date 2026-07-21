import { getLeagueRepository } from "@/lib/league/repository";
import AppShell from "@/components/AppShell";

// Legge sempre dati freschi dal DB (le mutazioni via API route + router.refresh()
// devono riflettersi immediatamente).
export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const repo = getLeagueRepository();
  const initialTab = (await searchParams)?.tab ?? "";

  const [
    userTeam,
    standings,
    editions,
    trades,
    flash,
    latestGiornata,
    presidentStandings,
    peerVotes,
    coachRatings,
  ] = await Promise.all([
    repo.getUserTeam(),
    repo.getStandings(),
    repo.getEditions(),
    repo.getTrades(),
    repo.getFlashNews(8),
    repo.getLatestGiornata(),
    repo.getPresidentStandings(),
    repo.getPeerVotes(),
    repo.getCoachRatings(12),
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
      presidentStandings={presidentStandings}
      peerVotes={peerVotes}
      coachRatings={coachRatings}
      demoMode={demoMode}
      initialTab={initialTab}
    />
  );
}
