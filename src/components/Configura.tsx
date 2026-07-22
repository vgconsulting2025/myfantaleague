"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  CalendarPreview,
  ImportPlayerRow,
  ImportResultRow,
  RosterPreview,
} from "@/lib/league/import/types";
import type { LeagueConfig, LeaguePlayer, LeagueTeam, Role } from "@/lib/league/types";
import { ErrorBox, SectionTitle, Spinner } from "./ui";
import TeamIdentityEditor from "./TeamIdentityEditor";

const ROLES: (Role | "?")[] = ["P", "D", "C", "A", "?"];
const FA_ROLES: Role[] = ["P", "D", "C", "A"];

/* ---------------- Sorgente dati (file o testo incollato) ---------------- */

function SourceInput({
  file,
  setFile,
  text,
  setText,
  onAnalyze,
  loading,
}: {
  file: File | null;
  setFile: (f: File | null) => void;
  text: string;
  setText: (t: string) => void;
  onAnalyze: () => void;
  loading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.tsv,.txt,.xlsx,.xls"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-verde file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-verde-700"
        />
        {file && (
          <button
            onClick={() => {
              setFile(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="text-xs font-semibold text-slate-500 hover:text-rose-600"
          >
            rimuovi
          </button>
        )}
      </div>
      <div className="text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
        oppure incolla i dati
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder={"Incolla qui una tabella copiata da Excel/Google Sheets (colonne separate da tab, ; o ,)"}
        className="w-full rounded-xl border border-slate-200 p-3 font-mono text-xs text-slate-700 focus:border-verde-500 focus:outline-none"
      />
      <button
        onClick={onAnalyze}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
      >
        Analizza
      </button>
    </div>
  );
}

function Warnings({ warnings }: { warnings: string[] }) {
  if (!warnings.length) return null;
  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
      <div className="mb-1 font-semibold">
        {warnings.length} avviso{warnings.length > 1 ? "i" : ""} — controlla e correggi in anteprima:
      </div>
      <ul className="max-h-32 list-disc space-y-0.5 overflow-auto pl-5 text-xs">
        {warnings.slice(0, 20).map((w, i) => (
          <li key={i}>{w}</li>
        ))}
      </ul>
    </div>
  );
}

function cellInput(value: string | number, onChange: (v: string) => void, extra = "") {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded border border-slate-200 px-2 py-1 text-sm focus:border-verde-500 focus:outline-none ${extra}`}
    />
  );
}

/* ---------------- Import rose ---------------- */

function RosterImportPanel({ onDone }: { onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [players, setPlayers] = useState<ImportPlayerRow[] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [myTeam, setMyTeam] = useState("");
  const [mode, setMode] = useState<"replace" | "merge">("replace");
  const [committing, setCommitting] = useState(false);

  const teams = useMemo(
    () => Array.from(new Set((players ?? []).map((p) => p.team).filter(Boolean))),
    [players],
  );
  const hasInvalidRole = (players ?? []).some((p) => !["P", "D", "C", "A"].includes(p.role));

  async function analyze() {
    setError(null);
    setLoading(true);
    setPlayers(null);
    try {
      const res = file
        ? await fetch("/api/import/preview", {
            method: "POST",
            body: (() => {
              const fd = new FormData();
              fd.append("kind", "roster");
              fd.append("file", file);
              return fd;
            })(),
          })
        : text.trim()
          ? await fetch("/api/import/preview", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ kind: "roster", text }),
            })
          : null;
      if (!res) {
        setError("Carica un file oppure incolla i dati.");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore di analisi.");
      const preview = data.preview as RosterPreview;
      setPlayers(preview.players);
      setWarnings(preview.warnings);
      setMapping(preview.mapping);
      setMyTeam(preview.teams[0] ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore di analisi.");
    } finally {
      setLoading(false);
    }
  }

  function update(i: number, field: keyof ImportPlayerRow, value: string) {
    setPlayers((prev) =>
      prev ? prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)) : prev,
    );
  }

  async function commit() {
    if (!players) return;
    setCommitting(true);
    setError(null);
    try {
      const res = await fetch("/api/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "roster", mode, myTeam: myTeam || null, players }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import non riuscito.");
      setPlayers(null);
      setFile(null);
      setText("");
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import non riuscito.");
    } finally {
      setCommitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-display text-xl font-semibold text-slate-900">1 · Rose</h3>
      <p className="mb-4 mt-1 text-sm text-slate-500">
        Colonne attese: <b>squadra</b> (la fanta-squadra), <b>giocatore</b>, <b>ruolo</b> (P/D/C/A),
        <b> club</b> (Serie A), <b>quotazione</b>. I nomi di colonna simili vengono riconosciuti
        automaticamente.
      </p>

      <SourceInput
        file={file}
        setFile={setFile}
        text={text}
        setText={setText}
        onAnalyze={analyze}
        loading={loading}
      />

      {loading && <Spinner label="Analisi del file in corso..." />}
      {error && <ErrorBox message={error} onRetry={undefined} />}

      {players && (
        <div className="mt-5">
          {Object.keys(mapping).length > 0 && (
            <p className="mb-2 text-xs text-slate-500">
              Colonne riconosciute:{" "}
              {Object.entries(mapping)
                .map(([k, v]) => `${k} → "${v}"`)
                .join(" · ")}
            </p>
          )}
          <Warnings warnings={warnings} />

          <div className="mt-3 max-h-[26rem] overflow-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-2 py-2">Squadra</th>
                  <th className="px-2 py-2">Giocatore</th>
                  <th className="px-2 py-2">Ruolo</th>
                  <th className="px-2 py-2">Club</th>
                  <th className="px-2 py-2">Quota</th>
                  <th className="px-2 py-2">FM</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => (
                  <tr
                    key={i}
                    className={`border-t border-slate-100 ${
                      !["P", "D", "C", "A"].includes(p.role) ? "bg-amber-50" : ""
                    }`}
                  >
                    <td className="px-2 py-1">{cellInput(p.team, (v) => update(i, "team", v))}</td>
                    <td className="px-2 py-1">{cellInput(p.name, (v) => update(i, "name", v))}</td>
                    <td className="px-2 py-1">
                      <select
                        value={p.role}
                        onChange={(e) => update(i, "role", e.target.value)}
                        className="w-full rounded border border-slate-200 px-2 py-1 text-sm focus:border-verde-500 focus:outline-none"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1">{cellInput(p.club, (v) => update(i, "club", v))}</td>
                    <td className="px-2 py-1">{cellInput(p.quota, (v) => update(i, "quota", v))}</td>
                    <td className="px-2 py-1">{cellInput(p.fm, (v) => update(i, "fm", v))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-4">
            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                La mia squadra
              </span>
              <select
                value={myTeam}
                onChange={(e) => setMyTeam(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-verde-500 focus:outline-none"
              >
                {teams.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <div className="text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Modalità
              </span>
              <div className="flex gap-3">
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    checked={mode === "replace"}
                    onChange={() => setMode("replace")}
                  />
                  Sostituisci lega
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    checked={mode === "merge"}
                    onChange={() => setMode("merge")}
                  />
                  Aggiorna
                </label>
              </div>
            </div>

            <button
              onClick={commit}
              disabled={committing || hasInvalidRole}
              title={hasInvalidRole ? "Correggi i ruoli evidenziati (P/D/C/A) prima di importare" : ""}
              className="ml-auto inline-flex items-center gap-2 rounded-xl bg-verde px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-verde-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {committing ? "Importo..." : `Conferma import (${players.length} giocatori)`}
            </button>
          </div>
          {hasInvalidRole && (
            <p className="mt-2 text-xs font-medium text-amber-700">
              Alcuni ruoli non sono riconosciuti (righe evidenziate): impostali su P/D/C/A per
              procedere.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- Import calendario ---------------- */

function CalendarImportPanel({ onDone }: { onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ImportResultRow[] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [committing, setCommitting] = useState(false);

  async function analyze() {
    setError(null);
    setLoading(true);
    setResults(null);
    try {
      const res = file
        ? await fetch("/api/import/preview", {
            method: "POST",
            body: (() => {
              const fd = new FormData();
              fd.append("kind", "calendar");
              fd.append("file", file);
              return fd;
            })(),
          })
        : text.trim()
          ? await fetch("/api/import/preview", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ kind: "calendar", text }),
            })
          : null;
      if (!res) {
        setError("Carica un file oppure incolla i dati.");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore di analisi.");
      const preview = data.preview as CalendarPreview;
      setResults(preview.results);
      setWarnings(preview.warnings);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore di analisi.");
    } finally {
      setLoading(false);
    }
  }

  function update(i: number, field: keyof ImportResultRow, value: string) {
    setResults((prev) =>
      prev ? prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)) : prev,
    );
  }

  async function commit() {
    if (!results) return;
    setCommitting(true);
    setError(null);
    try {
      const res = await fetch("/api/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "calendar", results }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import non riuscito.");
      setResults(null);
      setFile(null);
      setText("");
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import non riuscito.");
    } finally {
      setCommitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-display text-xl font-semibold text-slate-900">2 · Calendario / Risultati</h3>
      <p className="mb-4 mt-1 text-sm text-slate-500">
        Colonne attese: <b>giornata</b>, <b>squadra casa</b>, <b>squadra ospite</b>, <b>punti casa</b>,
        <b> punti ospite</b> (oppure una colonna <b>risultato</b> tipo &ldquo;68.5 - 74&rdquo;). I punti
        in classifica vengono ricalcolati dai risultati (3 vittoria / 1 pareggio).
      </p>

      <SourceInput
        file={file}
        setFile={setFile}
        text={text}
        setText={setText}
        onAnalyze={analyze}
        loading={loading}
      />

      {loading && <Spinner label="Analisi del file in corso..." />}
      {error && <ErrorBox message={error} onRetry={undefined} />}

      {results && (
        <div className="mt-5">
          <Warnings warnings={warnings} />
          <div className="mt-3 max-h-[26rem] overflow-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-2 py-2">Giornata</th>
                  <th className="px-2 py-2">Casa</th>
                  <th className="px-2 py-2">Ospite</th>
                  <th className="px-2 py-2">Pt casa</th>
                  <th className="px-2 py-2">Pt ospite</th>
                  <th className="px-2 py-2">Nota</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="w-20 px-2 py-1">
                      {cellInput(r.giornata, (v) => update(i, "giornata", v))}
                    </td>
                    <td className="px-2 py-1">{cellInput(r.home, (v) => update(i, "home", v))}</td>
                    <td className="px-2 py-1">{cellInput(r.away, (v) => update(i, "away", v))}</td>
                    <td className="w-24 px-2 py-1">
                      {cellInput(r.homeScore, (v) => update(i, "homeScore", v))}
                    </td>
                    <td className="w-24 px-2 py-1">
                      {cellInput(r.awayScore, (v) => update(i, "awayScore", v))}
                    </td>
                    <td className="px-2 py-1">{cellInput(r.note, (v) => update(i, "note", v))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={commit}
              disabled={committing}
              className="inline-flex items-center gap-2 rounded-xl bg-verde px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-verde-700 disabled:opacity-60"
            >
              {committing ? "Importo..." : `Conferma import (${results.length} partite)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Config Gazzetta + regole Agente svincolati ---------------- */

function GazzettaConfigPanel({
  config,
  onDone,
}: {
  config: LeagueConfig;
  onDone: (msg: string) => void;
}) {
  const [name, setName] = useState(config.gazzettaName);
  const [enabled, setEnabled] = useState(config.freeAgentEnabled);
  const [max, setMax] = useState(String(config.freeAgentMaxPerWeek));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gazzettaName: name,
          freeAgentEnabled: enabled,
          freeAgentMaxPerWeek: Number(max),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Salvataggio non riuscito.");
      onDone("Configurazione salvata.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Salvataggio non riuscito.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-display text-xl font-semibold text-slate-900">Gazzetta &amp; Agente svincolati</h3>
      <p className="mb-4 mt-1 text-sm text-slate-500">
        Personalizza il nome della testata e le regole con cui l&apos;Agente propone in autonomia
        scambi con gli svincolati (quando simuli una giornata).
      </p>

      {error && <ErrorBox message={error} onRetry={undefined} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Nome della Gazzetta
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-verde-500 focus:outline-none"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Max proposte svincolati / giornata
          </span>
          <input
            type="number"
            min={0}
            max={10}
            value={max}
            onChange={(e) => setMax(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-verde-500 focus:outline-none"
          />
        </label>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-verde focus:ring-verde"
        />
        <span className="font-medium text-slate-700">
          Abilita le proposte automatiche dell&apos;Agente sugli svincolati
        </span>
      </label>

      <div className="mt-5 flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-verde px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-verde-700 disabled:opacity-60"
        >
          {saving ? "Salvo..." : "Salva configurazione"}
        </button>
      </div>
    </div>
  );
}

/* ---------------- Gestione svincolati (CRUD manuale) ---------------- */

function FaRow({
  fa,
  busy,
  onSave,
  onRemove,
}: {
  fa: LeaguePlayer;
  busy: boolean;
  onSave: (patch: { name: string; role: Role; club: string; quota: number; fm: number }) => void;
  onRemove: () => void;
}) {
  const [name, setName] = useState(fa.name);
  const [role, setRole] = useState<Role>(fa.role);
  const [club, setClub] = useState(fa.club);
  const [quota, setQuota] = useState(String(fa.quota));
  const [fm, setFm] = useState(String(fa.fm));

  const dirty =
    name !== fa.name ||
    role !== fa.role ||
    club !== fa.club ||
    Number(quota) !== fa.quota ||
    Number(fm) !== fa.fm;

  const inputCls =
    "w-full rounded border border-slate-200 px-2 py-1 text-sm focus:border-verde-500 focus:outline-none";

  return (
    <tr className="border-t border-slate-100">
      <td className="px-2 py-1">
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
      </td>
      <td className="px-2 py-1">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="rounded border border-slate-200 px-2 py-1 text-sm focus:border-verde-500 focus:outline-none"
        >
          {FA_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </td>
      <td className="px-2 py-1">
        <input value={club} onChange={(e) => setClub(e.target.value)} className={inputCls} />
      </td>
      <td className="w-20 px-2 py-1">
        <input value={quota} onChange={(e) => setQuota(e.target.value)} className="w-16 rounded border border-slate-200 px-2 py-1 text-sm focus:border-verde-500 focus:outline-none" />
      </td>
      <td className="w-20 px-2 py-1">
        <input value={fm} onChange={(e) => setFm(e.target.value)} className="w-16 rounded border border-slate-200 px-2 py-1 text-sm focus:border-verde-500 focus:outline-none" />
      </td>
      <td className="whitespace-nowrap px-2 py-1 text-right">
        {dirty && (
          <button
            onClick={() => onSave({ name, role, club, quota: Number(quota), fm: Number(fm) })}
            disabled={busy}
            className="mr-3 text-xs font-semibold text-verde hover:text-verde-700 disabled:opacity-50"
          >
            salva
          </button>
        )}
        <button
          onClick={onRemove}
          disabled={busy}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-50"
        >
          rimuovi
        </button>
      </td>
    </tr>
  );
}

function FreeAgentsPanel({
  freeAgents,
  onDone,
}: {
  freeAgents: LeaguePlayer[];
  onDone: (msg: string) => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("A");
  const [club, setClub] = useState("");
  const [quota, setQuota] = useState("1");
  const [fm, setFm] = useState("6");
  const [adding, setAdding] = useState(false);

  async function call(body: Record<string, unknown>, id: string): Promise<boolean> {
    setError(null);
    setBusyId(id);
    try {
      const res = await fetch("/api/free-agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Operazione non riuscita.");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Operazione non riuscita.");
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function add() {
    setAdding(true);
    const ok = await call(
      { action: "add", name, role, club, quota: Number(quota), fm: Number(fm) },
      "add",
    );
    setAdding(false);
    if (ok) {
      setName("");
      setClub("");
      setQuota("1");
      setFm("6");
      onDone("Svincolato aggiunto.");
    }
  }

  const inputCls =
    "rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-verde-500 focus:outline-none";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-display text-xl font-semibold text-slate-900">
        Svincolati <span className="text-sm font-normal text-slate-400">({freeAgents.length})</span>
      </h3>
      <p className="mb-4 mt-1 text-sm text-slate-500">
        I giocatori senza fanta-squadra. All&apos;import, chi non è assegnato a una squadra diventa
        automaticamente svincolato. Qui puoi aggiungerli, modificarli o rimuoverli a mano.
      </p>

      {error && <ErrorBox message={error} onRetry={undefined} />}

      {/* Aggiungi svincolato */}
      <div className="mb-5 flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
        <input
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`${inputCls} flex-1 min-w-[8rem]`}
        />
        <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={inputCls}>
          {FA_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <input
          placeholder="Club"
          value={club}
          onChange={(e) => setClub(e.target.value)}
          className={`${inputCls} w-32`}
        />
        <input
          placeholder="Quota"
          type="number"
          value={quota}
          onChange={(e) => setQuota(e.target.value)}
          className={`${inputCls} w-20`}
        />
        <input
          placeholder="FM"
          type="number"
          value={fm}
          onChange={(e) => setFm(e.target.value)}
          className={`${inputCls} w-20`}
        />
        <button
          onClick={add}
          disabled={adding}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {adding ? "..." : "Aggiungi"}
        </button>
      </div>

      {/* Elenco */}
      {freeAgents.length === 0 ? (
        <p className="text-sm text-slate-400">Nessuno svincolato al momento.</p>
      ) : (
        <div className="max-h-[26rem] overflow-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[600px] border-collapse text-sm">
            <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-2 py-2">Giocatore</th>
                <th className="px-2 py-2">Ruolo</th>
                <th className="px-2 py-2">Club</th>
                <th className="px-2 py-2">Quota</th>
                <th className="px-2 py-2">FM</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {freeAgents.map((f) => (
                <FaRow
                  key={f.id}
                  fa={f}
                  busy={busyId === f.id}
                  onSave={async (patch) => {
                    if (await call({ action: "update", id: f.id, ...patch }, f.id)) {
                      onDone("Svincolato aggiornato.");
                    }
                  }}
                  onRemove={async () => {
                    if (await call({ action: "remove", id: f.id }, f.id)) {
                      onDone("Svincolato rimosso.");
                    }
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------------- Sezione principale ---------------- */

export default function Configura({
  userTeam,
  config,
  freeAgents,
}: {
  userTeam: LeagueTeam;
  config: LeagueConfig;
  freeAgents: LeaguePlayer[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  function refresh(msg: string) {
    setMessage(msg);
    startTransition(() => router.refresh());
  }

  async function resetDemo() {
    if (!window.confirm("Ripristinare la lega dimostrativa? I dati importati verranno sostituiti.")) {
      return;
    }
    setResetting(true);
    try {
      const res = await fetch("/api/import/reset", { method: "POST" });
      if (res.ok) refresh("Lega dimostrativa ripristinata.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div>
      <SectionTitle
        overline="Import dati"
        title="Configura la tua lega"
        action={
          <button
            onClick={resetDemo}
            disabled={resetting}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
          >
            {resetting ? "Ripristino..." : "Ripristina lega demo"}
          </button>
        }
      />

      <p className="mb-5 max-w-3xl text-sm text-slate-500">
        Carica le rose e il calendario della tua lega da file CSV/XLSX (esportati da Leghe
        Fantacalcio) oppure incolla i dati da un foglio di calcolo. Prima di confermare puoi rivedere
        e correggere ogni valore nell&apos;anteprima. La lega dimostrativa resta sempre ripristinabile
        con il pulsante qui sopra.
      </p>

      {message && (
        <div className="mb-5 rounded-xl border border-verde-200 bg-verde-50 px-4 py-3 text-sm font-medium text-verde-700">
          {message}
        </div>
      )}

      <div className="mb-6">
        <TeamIdentityEditor team={userTeam} />
      </div>

      <div className="mb-6 space-y-6">
        <GazzettaConfigPanel config={config} onDone={refresh} />
        <FreeAgentsPanel freeAgents={freeAgents} onDone={refresh} />
      </div>

      <div className="space-y-6">
        <RosterImportPanel onDone={() => refresh("Rose importate con successo.")} />
        <CalendarImportPanel onDone={() => refresh("Calendario importato con successo.")} />
      </div>
    </div>
  );
}
