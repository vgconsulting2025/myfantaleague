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

> Senza `ANTHROPIC_API_KEY` l'app funziona comunque: navighi le rose, la classifica e usi **Simula giornata**. I pulsanti "Genera l'edizione" e "Chiama l'Agente" mostreranno un messaggio d'errore chiaro finché la chiave non è configurata.

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
  components/               UI (client): AppShell + tab Gazzetta/Mercato/Squadra/Classifica
  lib/
    db.ts                  Singleton PrismaClient
    anthropic.ts           Client Anthropic + askClaude() + parseAiJson() (parsing robusto)
    league/
      types.ts             Tipi di dominio (indipendenti da Prisma)
      trades.ts            Logica PURA: validateProposals() / applyTrade()  ← testata
      trades.test.ts       Test Vitest
      repository.ts        Interfaccia astratta LeagueRepository + factory
      prisma-repository.ts Implementazione su Prisma/SQLite
```

**Punti chiave**

- **Layer dati astratto** (`lib/league/`): pagine e API route dipendono solo dall'interfaccia `LeagueRepository` e dai tipi di dominio, mai da Prisma direttamente.
- **AI solo lato server**: `lib/anthropic.ts` è importato esclusivamente nelle API route. `parseAiJson()` rimuove eventuali fence markdown, individua il JSON e valida la struttura, con fallback a un messaggio d'errore.
- **Validazione scambi**: la logica pura in `lib/league/trades.ts` è riusata sia dall'API route sia dai test — nessuna proposta con giocatori inesistenti va a buon fine, e lo swap è ri-validato anche al momento dell'accettazione.

---

## Sostituire la lega demo con dati reali

Il seed è solo una delle possibili sorgenti. Per collegare dati reali (Leghe Fantacalcio / Fantacalcio.it o un CSV) **non serve toccare UI o API route**: basta fornire una nuova implementazione del repository.

1. Crea una classe che implementa `LeagueRepository` (vedi `src/lib/league/repository.ts`), ad esempio `CsvLeagueRepository` o `FantacalcioApiRepository`, mappando i dati esterni sui **tipi di dominio** in `types.ts`.
2. Sostituisci l'implementazione restituita dalla factory in `getLeagueRepository()` (o rendila selezionabile via variabile d'ambiente).

Tutto il resto dell'app continua a funzionare invariato, perché lavora contro l'interfaccia astratta e non contro Prisma.

In alternativa, per un import una-tantum, puoi riscrivere lo script `prisma/seed.ts` per leggere da un CSV/API e continuare a usare l'implementazione Prisma.
