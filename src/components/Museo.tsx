import type { MuseumItem, MuseumType } from "@/lib/league/types";
import { SectionTitle } from "./ui";
import { formatDate } from "./format";

// Aspetto del medaglione per tipo di traguardo (stile premium oro/verde).
const TYPE_META: Record<MuseumType, { icon: string; medal: string }> = {
  leggenda: { icon: "♛", medal: "bg-[#02100a] text-oro ring-2 ring-[#e9cd6e]" },
  panchina: { icon: "★", medal: "bg-oro text-verde-900 ring-2 ring-oro-600" },
  record_score: { icon: "▲", medal: "bg-verde text-white ring-2 ring-verde-500" },
  record_margin: { icon: "⇅", medal: "bg-verde-700 text-white ring-2 ring-verde-500" },
  trade: { icon: "⇄", medal: "bg-oro-600 text-white ring-2 ring-oro" },
  derby: { icon: "⚔", medal: "bg-rose-600 text-white ring-2 ring-rose-300" },
};

// Sezioni del museo (raggruppano i tipi).
const SECTIONS: { title: string; types: MuseumType[] }[] = [
  { title: "Leggende", types: ["leggenda"] },
  { title: "Panchine d'oro", types: ["panchina"] },
  { title: "Record di giornata", types: ["record_score", "record_margin"] },
  { title: "Scambi storici", types: ["trade"] },
  { title: "Derby memorabili", types: ["derby"] },
];

function Plaque({ e }: { e: MuseumItem }) {
  const meta = TYPE_META[e.type];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold shadow ${meta.medal}`}
          aria-hidden
        >
          {meta.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-display text-base font-bold leading-snug text-slate-900">{e.title}</div>
          {e.subtitle && <div className="truncate text-sm font-medium text-slate-600">{e.subtitle}</div>}
          {e.detail && <div className="mt-0.5 text-xs text-slate-500">{e.detail}</div>}
          <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {formatDate(e.createdAt)}
            {e.giornata != null ? ` · Giornata ${e.giornata}` : ""}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Museo({ entries }: { entries: MuseumItem[] }) {
  const sections = SECTIONS.map((s) => ({
    title: s.title,
    items: entries.filter((e) => s.types.includes(e.type)),
  })).filter((s) => s.items.length > 0);

  return (
    <div>
      <SectionTitle
        overline="Albo d'oro della lega"
        title="Museo della lega"
        action={
          <span className="rounded-full bg-verde-900 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-oro">
            {entries.length} traguard{entries.length === 1 ? "o" : "i"}
          </span>
        }
      />

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-14 text-center">
          <div className="font-display text-2xl font-bold text-slate-800">Il museo è ancora vuoto</div>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            I traguardi storici — leggende, panchine d&apos;oro, record di giornata, scambi e derby
            memorabili — compariranno qui man mano che si verificano.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {sections.map((s) => (
            <section key={s.title}>
              <h3 className="mb-3 font-display text-lg font-semibold uppercase tracking-wide text-slate-700">
                {s.title} <span className="text-sm font-normal text-slate-400">({s.items.length})</span>
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {s.items.map((e) => (
                  <Plaque key={e.id} e={e} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
