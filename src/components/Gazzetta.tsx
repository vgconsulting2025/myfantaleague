"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Article, Edition, FlashItem } from "@/lib/league/types";
import { CategoryPill, ErrorBox, SectionTitle, Spinner } from "./ui";
import { formatDate, timeAgo } from "./format";

export default function Gazzetta({
  editions,
  flash,
  gazzettaName,
  recentNews,
}: {
  editions: Edition[];
  flash: FlashItem[];
  gazzettaName: string;
  recentNews: Article[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const latest = editions[0] ?? null;
  const selected = editions.find((e) => e.id === selectedId) ?? latest;

  async function genera() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/articles", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Errore di generazione.");
      setSelectedId(null); // dopo il refresh mostra la nuova edizione (la più recente)
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore di generazione.");
    } finally {
      setLoading(false);
    }
  }

  const lead = selected?.articles.find((a) => a.isLead) ?? selected?.articles[0] ?? null;
  const rest = selected ? selected.articles.filter((a) => a.id !== lead?.id) : [];
  const busy = loading || pending;

  return (
    <div>
      {/* Ultim'ora */}
      {flash.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2">
            <span className="pulse-dot h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-rose-600">
              Ultim&apos;ora
            </span>
          </div>
          <ul className="divide-y divide-slate-100">
            {flash.slice(0, 5).map((f) => (
              <li key={f.id} className="flex items-start gap-3 px-4 py-2.5">
                <span className="mt-0.5 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
                  Flash
                </span>
                <span className="flex-1 text-sm text-slate-700">{f.text}</span>
                <span className="whitespace-nowrap text-xs text-slate-400">
                  {timeAgo(f.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Dalla redazione — notizie singole (mercato e svincolati), goliardiche */}
      {recentNews.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-3 font-display text-lg font-semibold uppercase tracking-wide text-slate-700">
            Dalla redazione
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentNews.slice(0, 6).map((n) => (
              <article
                key={n.id}
                className="flex flex-col rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-2">
                  <CategoryPill category={n.category} />
                  {n.createdAt && (
                    <span className="text-xs text-slate-400">{timeAgo(n.createdAt)}</span>
                  )}
                </div>
                {n.kicker && (
                  <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-oro-700">
                    {n.kicker}
                  </div>
                )}
                <h4 className="mt-1 font-display text-lg font-semibold leading-snug text-slate-900">
                  {n.title}
                </h4>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 line-clamp-4">
                  {n.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      )}

      <SectionTitle
        overline={selected ? `Edizione · ${formatDate(selected.createdAt)}` : "Area notizie"}
        title={gazzettaName}
        action={
          <button
            onClick={genera}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-verde px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-verde-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {editions.length ? "Rigenera l'edizione" : "Genera l'edizione del giorno"}
          </button>
        }
      />

      {busy && <Spinner label="La redazione sta scrivendo gli articoli..." />}
      {error && <ErrorBox message={error} onRetry={genera} />}

      {!busy && !selected && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-14 text-center">
          <div className="font-display text-2xl font-bold text-slate-800">L&apos;edicola è vuota</div>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Genera l&apos;edizione del giorno: l&apos;AI leggerà risultati e classifica della lega e
            scriverà gli articoli della settimana.
          </p>
        </div>
      )}

      {!busy && selected && (
        <>
          {/* Articolo di apertura — blocco a tutta larghezza, verde scuro */}
          {lead && (
            <article className="mb-6 overflow-hidden rounded-2xl bg-verde-900 text-white shadow-lg ring-1 ring-verde-700">
              <div className="relative p-7 md:p-10">
                <div
                  aria-hidden
                  className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-bl-full bg-oro/10"
                />
                <span className="inline-block rounded-full bg-oro px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-verde-900">
                  {lead.category}
                </span>
                {lead.kicker && (
                  <div className="mt-4 text-sm font-semibold uppercase tracking-wide text-oro-200">
                    {lead.kicker}
                  </div>
                )}
                <h3 className="mt-2 font-display text-3xl font-bold leading-tight md:text-5xl">
                  {lead.title}
                </h3>
                <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-white/80 md:text-base">
                  {lead.body}
                </p>
              </div>
            </article>
          )}

          {/* Griglia di card */}
          {rest.length > 0 && (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((a) => (
                <article
                  key={a.id}
                  className="flex flex-col rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <CategoryPill category={a.category} />
                  <h4 className="mt-3 font-display text-xl font-semibold leading-snug text-slate-900">
                    {a.title}
                  </h4>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 line-clamp-5">
                    {a.body}
                  </p>
                  {a.kicker && (
                    <div className="mt-3 border-t border-slate-100 pt-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                      {a.kicker}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {/* Archivio edizioni */}
      {editions.length > 0 && (
        <div className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold uppercase tracking-wide text-slate-700">
              Archivio edizioni
            </h3>
            {latest && selected && selected.id !== latest.id && (
              <button
                onClick={() => setSelectedId(null)}
                className="text-xs font-semibold text-verde transition hover:text-verde-700"
              >
                ↩ Torna all&apos;ultima edizione
              </button>
            )}
          </div>
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
            {editions.map((e) => {
              const active = selected?.id === e.id;
              return (
                <button
                  key={e.id}
                  onClick={() => setSelectedId(e.id)}
                  className={`min-w-[190px] shrink-0 rounded-xl border p-4 text-left transition ${
                    active
                      ? "border-verde-500 bg-verde-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {e.giornata ? `Giornata ${e.giornata}` : "Edizione"}
                  </div>
                  <div className="mt-1 font-display text-base font-semibold text-slate-800">
                    {formatDate(e.createdAt)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">{e.articles.length} articoli</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
