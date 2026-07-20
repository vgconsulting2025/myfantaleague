import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeagueRepository } from "@/lib/league/repository";
import Figurina from "@/components/figurine/Figurina";
import { ROLE_LABELS } from "@/components/theme";

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
          className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
        >
          ← Torna a MyFantaLeague
        </Link>

        <div className="mt-6 flex flex-col items-center gap-8 sm:flex-row sm:items-start">
          <Figurina player={player} size="lg" />

          <div className="w-full">
            <div className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
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

            <p className="mt-5 max-w-md text-sm italic text-slate-400">
              Figurina generata dall&apos;app: personaggio di fantasia disegnato in SVG,
              stabile e riconoscibile per {player.name}. Nessuna foto o immagine reale.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
