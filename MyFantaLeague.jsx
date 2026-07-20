import React, { useState, useMemo } from "react";

/* ============================================================
   MyFantaLeague — prototipo
   Tre pilastri: Agente (scambi AI), Area Notizie (articoli AI),
   Gestione Squadra. Dati in memoria, lega dimostrativa.
   ============================================================ */

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Anton&family=Barlow+Condensed:wght@500;600;700&family=Source+Serif+4:ital,wght@0,400;0,600;1,400;1,600&display=swap');`;

const C = {
  paper: "#FBEDEF",      // rosa carta sportiva
  paperDeep: "#F5DFE3",
  ink: "#16181F",
  inkSoft: "#4A4650",
  verde: "#0B6E3A",
  rosso: "#C8102E",
  line: "#D8B9BF",
};

const fontHead = { fontFamily: "'Anton', sans-serif" };
const fontCond = { fontFamily: "'Barlow Condensed', sans-serif" };
const fontSerif = { fontFamily: "'Source Serif 4', serif" };

/* ---------------- Dati della lega (mock) ---------------- */

const initialTeams = [
  {
    id: "divano", name: "Real Divano", president: "Tu", points: 12,
    players: [
      { name: "Sommer", role: "P", club: "Inter", quota: 16, fm: 6.1 },
      { name: "Bastoni", role: "D", club: "Inter", quota: 22, fm: 6.4 },
      { name: "Bremer", role: "D", club: "Juventus", quota: 18, fm: 6.2 },
      { name: "Dimarco", role: "D", club: "Inter", quota: 24, fm: 6.9 },
      { name: "Barella", role: "C", club: "Inter", quota: 30, fm: 6.8 },
      { name: "Koopmeiners", role: "C", club: "Juventus", quota: 26, fm: 6.3 },
      { name: "Lautaro", role: "A", club: "Inter", quota: 42, fm: 7.4 },
      { name: "Kean", role: "A", club: "Fiorentina", quota: 28, fm: 7.0 },
    ],
  },
  {
    id: "sciacallo", name: "AC Sciacallo", president: "Marco", points: 15,
    players: [
      { name: "Maignan", role: "P", club: "Milan", quota: 17, fm: 6.2 },
      { name: "Pavard", role: "D", club: "Inter", quota: 15, fm: 6.1 },
      { name: "Buongiorno", role: "D", club: "Napoli", quota: 16, fm: 6.3 },
      { name: "Cambiaso", role: "D", club: "Juventus", quota: 17, fm: 6.4 },
      { name: "Pulisic", role: "C", club: "Milan", quota: 34, fm: 7.2 },
      { name: "Zaccagni", role: "C", club: "Lazio", quota: 24, fm: 6.7 },
      { name: "Retegui", role: "A", club: "Atalanta", quota: 34, fm: 7.3 },
      { name: "Thuram", role: "A", club: "Inter", quota: 36, fm: 7.1 },
    ],
  },
  {
    id: "polleria", name: "Sportiva Polleria", president: "Giulia", points: 9,
    players: [
      { name: "Di Gregorio", role: "P", club: "Juventus", quota: 15, fm: 6.0 },
      { name: "Calafiori", role: "D", club: "Bologna", quota: 14, fm: 6.2 },
      { name: "Dodo", role: "D", club: "Fiorentina", quota: 15, fm: 6.5 },
      { name: "Tavares", role: "D", club: "Lazio", quota: 18, fm: 6.8 },
      { name: "Reijnders", role: "C", club: "Milan", quota: 25, fm: 6.9 },
      { name: "Anguissa", role: "C", club: "Napoli", quota: 20, fm: 6.5 },
      { name: "Vlahovic", role: "A", club: "Juventus", quota: 34, fm: 6.7 },
      { name: "Lucca", role: "A", club: "Udinese", quota: 20, fm: 6.4 },
    ],
  },
  {
    id: "monaci", name: "Bayern Monaci", president: "Andrea", points: 13,
    players: [
      { name: "Svilar", role: "P", club: "Roma", quota: 14, fm: 6.4 },
      { name: "Gila", role: "D", club: "Lazio", quota: 12, fm: 6.1 },
      { name: "Thiaw", role: "D", club: "Milan", quota: 11, fm: 5.9 },
      { name: "Bellanova", role: "D", club: "Atalanta", quota: 14, fm: 6.3 },
      { name: "McTominay", role: "C", club: "Napoli", quota: 28, fm: 7.1 },
      { name: "Orsolini", role: "C", club: "Bologna", quota: 26, fm: 7.0 },
      { name: "Dybala", role: "A", club: "Roma", quota: 30, fm: 6.9 },
      { name: "David", role: "A", club: "Juventus", quota: 30, fm: 6.6 },
    ],
  },
];

const giornataResults = [
  {
    home: "Real Divano", away: "AC Sciacallo", score: "68.5 - 74",
    note: "Doppietta di Retegui, Lautaro sottotono (5.5). Sommer para un rigore ma non basta.",
  },
  {
    home: "Sportiva Polleria", away: "Bayern Monaci", score: "71 - 70.5",
    note: "Vittoria al fotofinish: gol di Vlahovic al 90'. McTominay 7.5 non basta ai Monaci.",
  },
];

/* ---------------- Chiamate AI ---------------- */

async function askClaude(prompt, maxTokens = 1000) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await response.json();
  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  return text;
}

function parseJson(text) {
  const clean = text.replace(/```json|```/g, "").trim();
  const start = Math.min(
    ...["[", "{"].map((c) => {
      const i = clean.indexOf(c);
      return i === -1 ? Infinity : i;
    })
  );
  return JSON.parse(clean.slice(start === Infinity ? 0 : start));
}

function rosterText(team) {
  return team.players
    .map((p) => `${p.name} (${p.role}, ${p.club}, quota ${p.quota}, fantamedia ${p.fm})`)
    .join("; ");
}

/* ---------------- Componenti UI ---------------- */

function RoleBadge({ role }) {
  const colors = { P: "#B98A1F", D: C.verde, C: "#1F5FB9", A: C.rosso };
  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-xs font-bold"
      style={{ background: colors[role], color: "#fff", width: 22, height: 22, ...fontCond }}
    >
      {role}
    </span>
  );
}

function SectionLabel({ children }) {
  return (
    <div
      className="uppercase tracking-widest text-xs font-bold mb-2"
      style={{ color: C.rosso, ...fontCond, letterSpacing: "0.18em" }}
    >
      {children}
    </div>
  );
}

function Spinner({ label }) {
  return (
    <div className="flex items-center gap-3 py-6 justify-center" style={{ color: C.inkSoft }}>
      <div
        className="rounded-full animate-spin"
        style={{ width: 18, height: 18, border: `3px solid ${C.line}`, borderTopColor: C.rosso }}
      />
      <span style={{ ...fontCond, fontSize: 18 }}>{label}</span>
    </div>
  );
}

/* ---------------- Tab: Notizie ---------------- */

function Notizie({ teams, articles, setArticles, feed }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const genera = async () => {
    setLoading(true);
    setError(null);
    try {
      const standings = [...teams]
        .sort((a, b) => b.points - a.points)
        .map((t, i) => `${i + 1}. ${t.name} (pres. ${t.president}) — ${t.points} punti`)
        .join("\n");
      const results = giornataResults
        .map((r) => `${r.home} vs ${r.away}: ${r.score}. ${r.note}`)
        .join("\n");
      const prompt = `Sei il redattore capo della gazzetta di una lega di fantacalcio italiana chiamata "Lega Bar Centrale". Scrivi con tono da quotidiano sportivo italiano: ironico, epico, con soprannomi e drammi da bar.

CLASSIFICA:
${standings}

RISULTATI GIORNATA 6:
${results}

Genera 4 articoli sulla giornata. Rispondi SOLO con JSON valido, nessun testo prima o dopo, nessun markdown. Formato:
[{"kicker":"occhiello breve","title":"titolo a effetto","body":"articolo di 60-90 parole","category":"CRONACA|PAGELLE|POLEMICHE|SPOGLIATOIO"}]
Il primo articolo è il pezzo di apertura sul risultato più clamoroso.`;
      const parsed = parseJson(await askClaude(prompt, 1000));
      setArticles(parsed);
    } catch (e) {
      setError("La redazione è in sciopero (errore di generazione). Riprova.");
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <SectionLabel>Area Notizie · Giornata 6</SectionLabel>
        <button
          onClick={genera}
          disabled={loading}
          className="px-4 py-2 rounded-none font-bold uppercase tracking-wide"
          style={{ background: C.ink, color: C.paper, ...fontCond, fontSize: 16 }}
        >
          {articles ? "Rigenera l'edizione" : "Genera l'edizione del giorno"}
        </button>
      </div>

      {feed.length > 0 && (
        <div className="mb-5">
          {feed.map((f, i) => (
            <div
              key={i}
              className="flex items-start gap-2 py-2"
              style={{ borderBottom: `1px solid ${C.line}` }}
            >
              <span
                className="px-2 py-0.5 text-xs font-bold uppercase mt-0.5"
                style={{ background: C.rosso, color: "#fff", ...fontCond }}
              >
                Ultim'ora
              </span>
              <span style={{ ...fontSerif, fontSize: 15 }}>{f}</span>
            </div>
          ))}
        </div>
      )}

      {loading && <Spinner label="La redazione sta scrivendo gli articoli..." />}
      {error && (
        <div className="py-3 px-4 mb-4" style={{ background: C.paperDeep, color: C.rosso, ...fontSerif }}>
          {error}
        </div>
      )}

      {!articles && !loading && (
        <div
          className="text-center py-14 px-6"
          style={{ border: `1px dashed ${C.line}`, color: C.inkSoft, ...fontSerif }}
        >
          <div style={{ ...fontHead, fontSize: 28, color: C.ink }} className="mb-2">
            L'edicola è vuota
          </div>
          Genera l'edizione del giorno: l'AI leggerà risultati e classifica della lega e scriverà gli
          articoli della settimana.
        </div>
      )}

      {articles && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {/* Apertura */}
          <div
            className="md:col-span-3 pb-6 mb-6"
            style={{ borderBottom: `3px solid ${C.ink}` }}
          >
            <span
              className="uppercase text-sm font-bold"
              style={{ color: C.rosso, ...fontCond, letterSpacing: "0.1em" }}
            >
              {articles[0].kicker}
            </span>
            <h2 style={{ ...fontHead, fontSize: "clamp(30px, 5vw, 52px)", lineHeight: 1.05 }} className="my-2">
              {articles[0].title}
            </h2>
            <p style={{ ...fontSerif, fontSize: 18, lineHeight: 1.55, maxWidth: "62ch" }}>
              {articles[0].body}
            </p>
          </div>
          {articles.slice(1).map((a, i) => (
            <div
              key={i}
              className="pr-5 pb-4 mb-2"
              style={{ borderRight: i < 2 ? `1px solid ${C.line}` : "none", paddingLeft: i > 0 ? 20 : 0 }}
            >
              <span
                className="uppercase text-xs font-bold"
                style={{ color: C.verde, ...fontCond, letterSpacing: "0.12em" }}
              >
                {a.category} · {a.kicker}
              </span>
              <h3 style={{ ...fontHead, fontSize: 22, lineHeight: 1.15 }} className="my-2">
                {a.title}
              </h3>
              <p style={{ ...fontSerif, fontSize: 15, lineHeight: 1.5 }}>{a.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Tab: Mercato (l'Agente) ---------------- */

function Mercato({ teams, setTeams, addFeed }) {
  const [loading, setLoading] = useState(false);
  const [proposals, setProposals] = useState(null);
  const [error, setError] = useState(null);
  const my = teams[0];

  const proponi = async () => {
    setLoading(true);
    setError(null);
    setProposals(null);
    try {
      const others = teams
        .slice(1)
        .map((t) => `SQUADRA "${t.name}" (presidente ${t.president}): ${rosterText(t)}`)
        .join("\n");
      const prompt = `Sei l'Agente di mercato di una lega di fantacalcio italiana. Analizzi le rose e proponi scambi credibili ed equilibrati tra la squadra dell'utente e le altre.

ROSA DELL'UTENTE "${my.name}": ${rosterText(my)}

ALTRE SQUADRE:
${others}

Proponi 3 scambi (1 giocatore per 1 giocatore, stesso ruolo o valore simile) che abbiano senso per ENTRAMBE le squadre. Usa solo giocatori presenti nelle rose, con i nomi esatti. Rispondi SOLO con JSON valido, nessun altro testo:
[{"otherTeam":"nome esatto squadra","give":"giocatore che l'utente cede","receive":"giocatore che l'utente riceve","rationale":"perché conviene a entrambi, 25-40 parole","agentComment":"battuta da procuratore navigato, max 15 parole"}]`;
      const parsed = parseJson(await askClaude(prompt, 900));
      const valid = parsed.filter((p) => {
        const other = teams.find((t) => t.name === p.otherTeam);
        return (
          other &&
          my.players.some((pl) => pl.name === p.give) &&
          other.players.some((pl) => pl.name === p.receive)
        );
      });
      if (valid.length === 0) throw new Error("no valid trades");
      setProposals(valid.map((p, i) => ({ ...p, id: i, status: "pending" })));
    } catch (e) {
      setError("L'Agente ha perso il telefono (errore di generazione). Riprova.");
    }
    setLoading(false);
  };

  const decidi = (id, accepted) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: accepted ? "accepted" : "rejected" } : p))
    );
    const prop = proposals.find((p) => p.id === id);
    if (accepted && prop) {
      setTeams((prev) => {
        const next = prev.map((t) => ({ ...t, players: [...t.players] }));
        const mine = next[0];
        const other = next.find((t) => t.name === prop.otherTeam);
        const giveIdx = mine.players.findIndex((pl) => pl.name === prop.give);
        const recvIdx = other.players.findIndex((pl) => pl.name === prop.receive);
        if (giveIdx >= 0 && recvIdx >= 0) {
          const a = mine.players[giveIdx];
          const b = other.players[recvIdx];
          mine.players[giveIdx] = b;
          other.players[recvIdx] = a;
        }
        return next;
      });
      addFeed(
        `UFFICIALE — ${my.name} cede ${prop.give} a ${prop.otherTeam} e accoglie ${prop.receive}. L'Agente incassa la commissione.`
      );
    } else if (prop) {
      addFeed(`Saltato lo scambio ${prop.give} ↔ ${prop.receive}: il presidente di ${my.name} ha detto no.`);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <SectionLabel>L'Agente · Mercato settimanale</SectionLabel>
        <button
          onClick={proponi}
          disabled={loading}
          className="px-4 py-2 font-bold uppercase tracking-wide"
          style={{ background: C.verde, color: "#fff", ...fontCond, fontSize: 16 }}
        >
          Chiama l'Agente
        </button>
      </div>

      {loading && <Spinner label="L'Agente sta studiando le rose..." />}
      {error && (
        <div className="py-3 px-4 mb-4" style={{ background: C.paperDeep, color: C.rosso, ...fontSerif }}>
          {error}
        </div>
      )}

      {!proposals && !loading && (
        <div
          className="text-center py-14 px-6"
          style={{ border: `1px dashed ${C.line}`, color: C.inkSoft, ...fontSerif }}
        >
          <div style={{ ...fontHead, fontSize: 28, color: C.ink }} className="mb-2">
            Il mercato è fermo
          </div>
          Chiama l'Agente: analizzerà la tua rosa e quelle degli avversari per proporti gli scambi
          della settimana.
        </div>
      )}

      {proposals && (
        <div className="grid grid-cols-1 gap-4">
          {proposals.map((p) => (
            <div
              key={p.id}
              className="p-5"
              style={{
                background: p.status === "accepted" ? "#EAF3EC" : p.status === "rejected" ? C.paperDeep : "#fff",
                border: `1px solid ${C.line}`,
                opacity: p.status === "rejected" ? 0.6 : 1,
              }}
            >
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span style={{ ...fontHead, fontSize: 20 }}>
                  {p.give} <span style={{ color: C.rosso }}>⇄</span> {p.receive}
                </span>
                <span style={{ ...fontCond, fontSize: 16, color: C.inkSoft }}>
                  con {p.otherTeam}
                </span>
              </div>
              <p style={{ ...fontSerif, fontSize: 15, lineHeight: 1.5 }} className="mb-2">
                {p.rationale}
              </p>
              <p style={{ ...fontSerif, fontStyle: "italic", fontSize: 14, color: C.inkSoft }} className="mb-3">
                L'Agente: «{p.agentComment}»
              </p>
              {p.status === "pending" ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => decidi(p.id, true)}
                    className="px-4 py-1.5 font-bold uppercase"
                    style={{ background: C.verde, color: "#fff", ...fontCond }}
                  >
                    Accetta
                  </button>
                  <button
                    onClick={() => decidi(p.id, false)}
                    className="px-4 py-1.5 font-bold uppercase"
                    style={{ background: "transparent", color: C.rosso, border: `2px solid ${C.rosso}`, ...fontCond }}
                  >
                    Rifiuta
                  </button>
                </div>
              ) : (
                <span
                  className="uppercase font-bold text-sm"
                  style={{ color: p.status === "accepted" ? C.verde : C.rosso, ...fontCond, letterSpacing: "0.08em" }}
                >
                  {p.status === "accepted" ? "Scambio ufficializzato" : "Proposta rifiutata"}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Tab: La mia squadra ---------------- */

function Squadra({ teams }) {
  const my = teams[0];
  const byRole = useMemo(() => {
    const order = ["P", "D", "C", "A"];
    return order.map((r) => ({ role: r, players: my.players.filter((p) => p.role === r) }));
  }, [my]);
  const totalQuota = my.players.reduce((s, p) => s + p.quota, 0);
  const avgFm = (my.players.reduce((s, p) => s + p.fm, 0) / my.players.length).toFixed(2);
  const roleNames = { P: "Portieri", D: "Difensori", C: "Centrocampisti", A: "Attaccanti" };

  return (
    <div>
      <SectionLabel>Gestione Squadra · {my.name}</SectionLabel>
      <div className="flex flex-wrap gap-6 mb-6">
        <div>
          <div style={{ ...fontHead, fontSize: 34 }}>{totalQuota}</div>
          <div style={{ ...fontCond, fontSize: 15, color: C.inkSoft }} className="uppercase">Valore rosa (crediti)</div>
        </div>
        <div>
          <div style={{ ...fontHead, fontSize: 34 }}>{avgFm}</div>
          <div style={{ ...fontCond, fontSize: 15, color: C.inkSoft }} className="uppercase">Fantamedia squadra</div>
        </div>
        <div>
          <div style={{ ...fontHead, fontSize: 34 }}>{my.points}</div>
          <div style={{ ...fontCond, fontSize: 15, color: C.inkSoft }} className="uppercase">Punti in classifica</div>
        </div>
      </div>

      {byRole.map(({ role, players }) => (
        <div key={role} className="mb-5">
          <div
            className="uppercase font-bold mb-1"
            style={{ ...fontCond, fontSize: 17, letterSpacing: "0.08em", borderBottom: `2px solid ${C.ink}` }}
          >
            {roleNames[role]}
          </div>
          {players.map((p) => (
            <div
              key={p.name}
              className="flex items-center gap-3 py-2"
              style={{ borderBottom: `1px solid ${C.line}` }}
            >
              <RoleBadge role={p.role} />
              <span style={{ ...fontSerif, fontWeight: 600, fontSize: 16 }} className="flex-1">
                {p.name}
                <span style={{ fontWeight: 400, color: C.inkSoft, fontSize: 14 }}> · {p.club}</span>
              </span>
              <span style={{ ...fontCond, fontSize: 15, color: C.inkSoft }}>quota {p.quota}</span>
              <span
                style={{ ...fontCond, fontSize: 15, color: p.fm >= 6.8 ? C.verde : C.ink, fontWeight: 700 }}
              >
                FM {p.fm}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ---------------- Tab: Classifica ---------------- */

function Classifica({ teams }) {
  const sorted = [...teams].sort((a, b) => b.points - a.points);
  return (
    <div>
      <SectionLabel>Classifica · Lega Bar Centrale</SectionLabel>
      {sorted.map((t, i) => (
        <div
          key={t.id}
          className="flex items-center gap-4 py-3"
          style={{ borderBottom: `1px solid ${C.line}`, background: t.id === "divano" ? "#fff" : "transparent" }}
        >
          <span style={{ ...fontHead, fontSize: 24, width: 34, textAlign: "center", color: i === 0 ? C.rosso : C.ink }}>
            {i + 1}
          </span>
          <div className="flex-1">
            <div style={{ ...fontHead, fontSize: 18 }}>{t.name}</div>
            <div style={{ ...fontCond, fontSize: 14, color: C.inkSoft }} className="uppercase">
              Presidente: {t.president}
            </div>
          </div>
          <span style={{ ...fontHead, fontSize: 24 }}>{t.points}</span>
        </div>
      ))}
      <p style={{ ...fontSerif, fontSize: 13, color: C.inkSoft }} className="mt-4 italic">
        Lega dimostrativa — nel prodotto finale rose e risultati arrivano dalla piattaforma di gioco.
      </p>
    </div>
  );
}

/* ---------------- App ---------------- */

export default function MyFantaLeague() {
  const [teams, setTeams] = useState(initialTeams);
  const [tab, setTab] = useState("notizie");
  const [articles, setArticles] = useState(null);
  const [feed, setFeed] = useState([]);
  const addFeed = (msg) => setFeed((prev) => [msg, ...prev].slice(0, 5));

  const tabs = [
    { id: "notizie", label: "La Gazzetta" },
    { id: "mercato", label: "Mercato" },
    { id: "squadra", label: "La Mia Squadra" },
    { id: "classifica", label: "Classifica" },
  ];

  return (
    <div className="min-h-screen" style={{ background: C.paper, color: C.ink }}>
      <style>{FONT_IMPORT}</style>

      {/* Testata */}
      <header className="px-5 pt-6 pb-0 max-w-5xl mx-auto">
        <div className="flex items-end justify-between flex-wrap gap-2">
          <div>
            <div style={{ ...fontCond, fontSize: 15, color: C.rosso }} className="uppercase tracking-widest font-bold">
              Lega Bar Centrale · Stagione 2025/26
            </div>
            <h1 style={{ ...fontHead, fontSize: "clamp(38px, 7vw, 64px)", lineHeight: 1 }}>
              MyFantaLeague
            </h1>
          </div>
          <div style={{ ...fontSerif, fontStyle: "italic", fontSize: 15, color: C.inkSoft }} className="pb-2">
            La tua lega, viva tutti i giorni.
          </div>
        </div>

        {/* Navigazione */}
        <nav className="flex gap-1 mt-4 flex-wrap" style={{ borderBottom: `3px solid ${C.ink}` }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-2 uppercase font-bold"
              style={{
                ...fontCond,
                fontSize: 17,
                letterSpacing: "0.06em",
                background: tab === t.id ? C.ink : "transparent",
                color: tab === t.id ? C.paper : C.ink,
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="px-5 py-6 max-w-5xl mx-auto">
        {tab === "notizie" && (
          <Notizie teams={teams} articles={articles} setArticles={setArticles} feed={feed} />
        )}
        {tab === "mercato" && <Mercato teams={teams} setTeams={setTeams} addFeed={addFeed} />}
        {tab === "squadra" && <Squadra teams={teams} />}
        {tab === "classifica" && <Classifica teams={teams} />}
      </main>
    </div>
  );
}
