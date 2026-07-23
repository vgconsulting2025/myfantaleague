import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeagueRepository } from "@/lib/league/repository";
import FigurinaViewer from "@/components/figurine/FigurinaViewer";
import FigurinaUploader from "@/components/figurine/FigurinaUploader";
import PlayerNumberEditor from "@/components/figurine/PlayerNumberEditor";
import { ROLE_LABELS } from "@/components/theme";
import { displayNumber } from "@/lib/league/identity";

export const dynamic = "force-dynamic";

export default async function FigurinaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = await getLeagueRepository().getPlayerById(id);
  if (!found) notFound();

  const { player, teamName, isUser } = found;

  const stats: { label: string; value: string }[] = [
    { label: "Ruolo", value: ROLE_LABELS[player.role] },
    { label: "Club", value: player.club || "—" },
    { label: "Quotazione", value: String(player.quota) },
    { label: "Fantamedia", value: player.fm.toFixed(1) },
  ];

  return (
    <main className="min-h-full bg-[#F4F6F8]">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link
          href="/"
          className="text-sm font-semibold text-verde-700 transition hover:text-verde-700"
        >
          ← Torna a MyFantaLeague
        </Link>

        <div className="mt-6 flex flex-col items-center gap-8 sm:flex-row sm:items-start">
          <FigurinaViewer player={player} />

          <div className="w-full">
            <div className="text-xs font-semibold uppercase tracking-widest text-verde">
              {teamName}
              {isUser ? " · La tua squadra" : ""}
            </div>
            <h1 className="font-display text-4xl font-bold text-slate-900">{player.name}</h1>

            <dl className="mt-5 grid max-w-md grid-cols-2 gap-3">
              {stats.map((st) => (
                <div key={st.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {st.label}
                  </dt>
                  <dd className="font-display text-xl font-bold text-slate-900">{st.value}</dd>
                </div>
              ))}
            </dl>

            {!player.imageUrl && (
              <p className="mt-5 max-w-md text-sm italic text-slate-400">
                Immagine di default: la maglia della squadra (o la maglia di default dell&apos;app)
                con nome e numero. Carica una foto per personalizzarla.
              </p>
            )}

            {isUser && (
              <div className="max-w-md">
                <PlayerNumberEditor playerId={player.id} current={displayNumber(player)} />
                <FigurinaUploader playerId={player.id} hasImage={!!player.imageUrl} />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
