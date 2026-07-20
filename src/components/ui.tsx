// Primitive UI riutilizzabili.
import type { Role } from "@/lib/league/types";
import { ROLE_BADGE, categoryStyle } from "./theme";

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={`inline-flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-bold text-white ${ROLE_BADGE[role]}`}
    >
      {role}
    </span>
  );
}

export function CategoryPill({ category }: { category: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${categoryStyle(
        category,
      )}`}
    >
      {category}
    </span>
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-[3px] border-slate-200 border-t-emerald-500" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
      <span>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700"
        >
          Riprova
        </button>
      )}
    </div>
  );
}

export function SectionTitle({
  overline,
  title,
  action,
}: {
  overline?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {overline && (
          <div className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
            {overline}
          </div>
        )}
        <h2 className="font-display text-3xl font-bold text-slate-900">{title}</h2>
      </div>
      {action}
    </div>
  );
}
