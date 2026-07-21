# MyFantaLeague ⚽

App companion per leghe di fantacalcio italiane: tiene viva la lega **tutti i giorni**, non solo nel weekend. Tre pilastri:

1. **L'Agente** — un agente di mercato AI che analizza le rose di tutte le squadre e propone scambi credibili ed equilibrati, con motivazioni per entrambe le parti.
2. **La Gazzetta** — una redazione AI che genera articoli in stile quotidiano sportivo (ironico, epico, da bar) su risultati, pagelle, polemiche, retroscena e ultim'ora di mercato.
3. **La Mia Squadra** — gestione della rosa: giocatori per ruolo, quotazioni, fantamedia, valore rosa, punti.

Interfaccia in italiano, stile **portale di notizie**: header scuro fisso con menu e badge notifiche sul Mercato, card bianche arrotondate su sfondo chiaro, accento verde campo.

---

## Stack

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS v4**
- **Prisma** + **SQLite** per la persistenza (squadre, rose, giornate, risultati, scambi, edizioni, articoli, ultim'ora)
- **exceljs** per leggere i file XLSX lato server nell'import lega
- **SDK ufficiale Anthropic** (`@anthropic-ai/sdk`) usato **solo lato server** (API route), modello `claude-sonnet-4-6`
- **Vitest** per i test della logica scambi

---

## Setup

### 1. Installa le dipendenze

```bash
npm install
```

### 2. Configura le variabili d'ambiente

Copia il file di esempio e inserisci la tua chiave Anthropic:

```bash
cp .env.example .env
```

Poi apri `.env` e imposta:

```dotenv
ANTHROPIC_API_KEY=sk-ant-...          # da https://console.anthropic.com/
DATABASE_URL="file:./dev.db"          # già pronto per SQLite locale
```

> La chiave vive **solo** in `process.env.ANTHROPIC_API_KEY`, letta esclusivamente nelle API route lato server: non finisce mai nel bundle client. `.env*` è in `.gitignore`.

### 3. Crea il database e popola la lega demo

```bash
npx prisma migrate dev      # crea dev.db, applica le migrazioni e genera il client
npm run seed                # popola 6 squadre (~15 giocatori) + 1 giornata iniziale
```

(`prisma migrate dev` esegue automaticamente anche il seed la prima volta.)

### 4. Avvia l'app

```bash
npm run dev
```

Apri **http://localhost:3000**.

> Senza `ANTHROPIC_API_KEY` l'app parte comunque in **modalità demo**: "Genera l'edizione" e "Chiama l'Agente" producono contenuti da template locali (vedi sotto), oltre a navigazione, rose, classifica e **Simula giornata**.

### Comandi utili

| Comando | Descrizione |
| --- | --- |
| `npm run dev` | Server di sviluppo |
| `npm run build` / `npm start` | Build e avvio di produzione |
| `npm run seed` | Ri-popola la lega demo (reset dei dati) |
| `npm run db:reset` | Reset completo del DB + seed |
| `npm test` | Test della logica di validazione/esecuzione scambi |
| `npm run lint` | Lint |

---

## Come funziona (il ciclo evento → notizia → mercato)

1. **Simula giornata** (pulsante nell'header) genera risultati plausibili (60–85) tra le squadre, aggiorna la classifica e crea il contesto per la Gazzetta. _Nessuna chiamata AI, tutto locale._
2. **La Gazzetta → "Genera l'edizione del giorno"**: l'API route costruisce il contesto (classifica + risultati dell'ultima giornata + scambi recenti) e chiede all'AI 4–6 articoli in JSON. L'edizione viene salvata e resta consultabile nell'**Archivio edizioni**.
3. **Mercato → "Chiama l'Agente"**: l'API route invia le rose all'AI e riceve 3 proposte di scambio 1-per-1. Ogni proposta è **validata lato server** (i giocatori devono esistere davvero nelle rose indicate); le proposte non valide vengono scartate.
4. **Accetta / Rifiuta**: se accettato, lo scambio viene eseguito nel DB (i giocatori cambiano rosa, in transazione), registrato nello **Storico scambi** e genera una notizia flash in **Ultim'ora**. Se rifiutato, genera comunque una notizia di mercato saltato.

---

## Modalità demo (senza chiave AI)

Se `ANTHROPIC_API_KEY` **non è impostata** (o è vuota), le route `/api/articles` e `/api/trades` **non falliscono**: generano contenuti da **template locali**, con frasi precompilate variate casualmente e riempite con i **dati reali della lega** (nomi squadre, presidenti, risultati dell'ultima giornata, giocatori delle rose, ultimo scambio).

- La Gazzetta produce 4–6 articoli (cronaca, pagelle, polemiche, mercato, spogliatoio) costruiti sui dati correnti.
- L'Agente propone 3 scambi 1-per-1 tra giocatori dello **stesso ruolo** realmente presenti nelle rose (passano la stessa validazione delle proposte AI).
- L'interfaccia mostra un piccolo avviso **"Modalità demo — contenuti non generati da AI"** nella barra sotto l'header.

La logica è pura e testabile: vedi `src/lib/league/demo-content.ts` (`generateDemoArticles`, `generateDemoProposals`) e i relativi test in `src/lib/league/demo-content.test.ts`. Appena si configura la chiave, le stesse route passano automaticamente alla generazione via AI.

---

## Importa la tua lega (da Leghe Fantacalcio)

Le piattaforme come **Leghe Fantacalcio** non hanno API pubbliche, ma permettono di **esportare** rose e calendario in Excel/CSV. Dalla scheda **"Configura"** dell'app puoi caricarli (o incollarli) e sostituire/aggiornare la lega nel database.

### Come esportare da Leghe Fantacalcio

> I nomi esatti delle voci di menu cambiano di stagione in stagione; l'idea resta la stessa.

- **Rose**: nell'area di gestione della lega cerca la voce di *Esporta* / *Download* delle **rose** (di solito un file Excel `.xlsx`). In alternativa apri la pagina delle rose e **copia** la tabella.
- **Calendario / Risultati**: esporta (o copia) il **calendario** o i **risultati** delle giornate.

Se l'export non è già "piatto", aprilo con Excel/Google Sheets e disponi i dati in colonne (una riga per giocatore / per partita), poi salva come CSV o copia le celle.

### Colonne attese (i nomi simili sono riconosciuti automaticamente)

**Rose** — una riga per giocatore:

| squadra | giocatore | ruolo | club | quotazione |
|---|---|---|---|---|
| Real Divano | Sommer | P | Inter | 16 |

- `squadra` = la **fanta-squadra** proprietaria; `club` = la squadra di **Serie A**.
- `ruolo` accetta `P/D/C/A`, forme estese (`Por/Dif/Cen/Att`, `Portiere`…) e le abbreviazioni Mantra più comuni.
- Altri sinonimi: `fantasquadra`/`proprietario` (squadra), `nome`/`calciatore` (giocatore), `quota`/`costo`/`crediti` (quotazione), `fantamedia`/`fm` (facoltativa).

**Calendario / Risultati** — una riga per partita:

| giornata | casa | ospite | punti casa | punti ospite |
|---|---|---|---|---|
| 6 | Real Divano | AC Sciacallo | 68.5 | 74 |

- In alternativa alle due colonne punti è accettata un'unica colonna `risultato` tipo `68.5 - 74`.
- I **punti in classifica vengono ricalcolati** dai risultati (3 vittoria / 1 pareggio).

### Flusso di import

1. Apri la scheda **Configura**.
2. In **Rose** (o **Calendario**) **carica** un file `.csv`/`.xlsx` **oppure incolla** i dati e premi **Analizza**.
3. Controlla l'**anteprima**: puoi correggere ogni cella; le righe con ruolo non riconosciuto sono evidenziate.
4. Per le rose scegli **La mia squadra** e la modalità **Sostituisci lega** (riparte da zero) o **Aggiorna** (upsert per nome squadra).
5. Premi **Conferma import**. In caso di formato non riconosciuto compaiono messaggi d'errore chiari su cosa correggere.

La **lega dimostrativa** del seed resta sempre disponibile: il pulsante **"Ripristina lega demo"** la ripristina in qualsiasi momento.

---

## Figurine dei giocatori

Ogni giocatore ha una **figurina** in stile album, disegnata come componente **SVG/CSS originale** (nessuna foto, nessuna caricatura di persone reali):

- cornice verticale stondata con effetto lucido; **variante "rara" dorata** per fantamedia ≥ 7;
- fascia superiore coi **colori del club** (`lib/league/clubColors.ts`);
- **avatar caricaturale**: un volto composto da set di tratti SVG (forma viso, capelli, barba/baffi, carnagione, espressione, accessorio come fascetta/colletto) scelti in modo **deterministico dal nome** — stesso nome → stesso personaggio, ma di fantasia (oltre 1 milione di combinazioni);
- nome, badge ruolo (P/D/C/A), quotazione e fantamedia.

Le figurine compaiono in **La Mia Squadra** (griglia per reparto con toggle Figurine/Elenco), nelle proposte del **Mercato** (affiancate con freccia di scambio) e in miniatura nelle liste. Un clic apre la pagina della **figurina ingrandita** (`/figurina/[id]`). La logica (colori club, selezione tratti) è nel layer `lib/` ed è testata.

### Immagini personalizzate

Dalla **figurina ingrandita** di un giocatore della **propria rosa** puoi caricare un'immagine personalizzata (PNG/JPG/WebP, max 2 MB): sostituisce l'avatar generato **ovunque** compaia quel giocatore (griglia squadra, mercato, miniature). Il pulsante **"Rimuovi immagine"** ripristina l'avatar generato.

- Le immagini sono salvate come **file statici** in `public/uploads/players/` e referenziate nel DB (`Player.imageUrl`), **non** in base64. La cartella `public/uploads/` è **esclusa da git** (`.gitignore`).
- La validazione di formato e dimensione avviene **lato server**; si può caricare solo per i giocatori della propria squadra.
- ⚠️ **Il contenuto caricato è responsabilità dell'utente**: caricando un'immagine dichiari di averne i diritti e ti assumi la responsabilità di ciò che pubblichi.

---

## Voti agli allenatori

Rubrica goliardica sui **presidenti** della lega, nella scheda **Voti**.

- **Voto automatico dell'AI**: a ogni "Simula giornata" vengono generati i voti dei giocatori e la **formazione** schierata da ciascun presidente; l'AI (o, in modalità demo, un motore locale basato sugli stessi dati) assegna un **voto 1-10** e un commento sarcastico che punisce i gioielli lasciati in panchina e i titolari flop. I voti sono salvati e collegati alla giornata; una rubrica fissa **"PANCHINE"** entra nell'edizione della Gazzetta.
- **Voto tra presidenti**: ciascun presidente può votare (1-10) gli altri con un commento facoltativo (max 140 caratteri). **Non si può votare la propria squadra.** La **bacheca** mostra i commenti ricevuti senza filtri; come admin di lega puoi rimuovere un commento.
- **Classifica presidenti** per media voto (AI + lega) con **badge scherzosi**: 🏆 *Allenatore del mese* al migliore, 🪑 *Panchina d'oro* al peggiore.

La logica pura (valutazione allenatore, divieto di autovoto, calcolo medie e badge) è in `lib/league/coach.ts` ed è testata.

---

## Architettura

```
prisma/
  schema.prisma            Modello dati (Team, Player, Giornata, Result, Edition, Article, Trade, FlashNews)
  seed.ts                  Lega demo: 6 squadre × ~15 giocatori Serie A + 1 giornata
src/
  app/
    page.tsx               Server Component: carica lo stato dal repository → <AppShell>
    layout.tsx             Font (Inter + Oswald), metadata
    api/
      articles/route.ts    POST  Genera l'edizione (AI)
      trades/route.ts      POST  "Chiama l'Agente" → 3 proposte validate (AI)
      trades/decide/route.ts POST Accetta/Rifiuta → esegue lo scambio + flash news
      simulate/route.ts    POST  Simula giornata (locale)
      import/preview       POST  Analizza file/testo → anteprima strutturata
      import/commit        POST  Scrive la lega importata (replace/merge)
      import/reset         POST  Ripristina la lega demo
      president-vote       POST  Voto tra presidenti (+ /hide per l'admin)
      players/[id]/image   POST/DELETE  Carica/rimuovi immagine giocatore
  components/               UI: AppShell + tab Gazzetta/Mercato/Squadra/Classifica/Voti/Configura
    figurine/              PlayerAvatar (SVG) + Figurina (card sticker)
  app/figurina/[id]/       Pagina della figurina ingrandita
  lib/
    db.ts                  Singleton PrismaClient
    anthropic.ts           Client Anthropic + askClaude() + parseAiJson() (parsing robusto)
    league/
      types.ts             Tipi di dominio (indipendenti da Prisma)
      trades.ts            Logica PURA: validateProposals() / applyTrade()  ← testata
      coach.ts             Logica PURA voti allenatori/presidenti           ← testata
      uploads.ts           Validazione immagini caricate (formato/dimensione) ← testata
      demo-content.ts      Contenuti da template locali (modalità demo)     ← testata
      demo-league.ts       Dataset della lega demo (condiviso seed + reset)
      import/parse.ts      Parsing tollerante CSV/TSV/incollato               ← testata
      import/xlsx.ts       Lettura XLSX via exceljs (server)
      *.test.ts            Test Vitest (trades + demo-content + import/parse)
      clubColors.ts        Mappa club Serie A → colori (per le figurine)      ← testata
      repository.ts        Interfaccia astratta LeagueRepository + factory
      prisma-repository.ts Implementazione su Prisma/SQLite
    figurine/traits.ts     Selezione deterministica dei tratti avatar         ← testata
```

**Punti chiave**

- **Layer dati astratto** (`lib/league/`): pagine e API route dipendono solo dall'interfaccia `LeagueRepository` e dai tipi di dominio, mai da Prisma direttamente.
- **AI solo lato server**: `lib/anthropic.ts` è importato esclusivamente nelle API route. `parseAiJson()` rimuove eventuali fence markdown, individua il JSON e valida la struttura, con fallback a un messaggio d'errore.
- **Validazione scambi**: la logica pura in `lib/league/trades.ts` è riusata sia dall'API route sia dai test — nessuna proposta con giocatori inesistenti va a buon fine, e lo swap è ri-validato anche al momento dell'accettazione.

---

## Sostituire la lega demo con dati reali

Il modo più semplice è la scheda **"Configura"** (vedi [Importa la tua lega](#importa-la-tua-lega-da-leghe-fantacalcio)): upload/incolla di CSV/XLSX, anteprima e conferma, senza scrivere codice.

Per integrazioni più strutturate (import automatico da una piattaforma) il seed è solo una delle possibili sorgenti: **non serve toccare UI o API route**, basta fornire una nuova implementazione del repository.

1. Crea una classe che implementa `LeagueRepository` (vedi `src/lib/league/repository.ts`), ad esempio `CsvLeagueRepository` o `FantacalcioApiRepository`, mappando i dati esterni sui **tipi di dominio** in `types.ts`.
2. Sostituisci l'implementazione restituita dalla factory in `getLeagueRepository()` (o rendila selezionabile via variabile d'ambiente).

Tutto il resto dell'app continua a funzionare invariato, perché lavora contro l'interfaccia astratta e non contro Prisma.

In alternativa, per un import una-tantum, puoi riscrivere lo script `prisma/seed.ts` per leggere da un CSV/API e continuare a usare l'implementazione Prisma.
