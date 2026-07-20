# MyFantaLeague — Prompt per Claude Code

Costruisci un'applicazione web completa chiamata **MyFantaLeague**: un'app "companion" per leghe di fantacalcio italiane che tiene viva la lega tutti i giorni, non solo nel weekend. I tre pilastri del prodotto sono:

1. **L'Agente** — un agente di mercato AI che ogni settimana analizza le rose di tutte le squadre della lega e propone scambi credibili ed equilibrati tra i presidenti, con motivazioni per entrambe le parti.
2. **Area Notizie** — una redazione AI che genera articoli in stile quotidiano sportivo italiano (tono ironico, epico, da bar) su: risultati della giornata, pagelle, polemiche, retroscena, e ultim'ora sugli scambi accettati o rifiutati.
3. **Gestione Squadra** — gestione della propria rosa: giocatori per ruolo (P/D/C/A), quotazioni, fantamedia, valore totale della rosa, punti in classifica.

## Riferimento

Nella cartella del progetto c'è (se presente) `MyFantaLeague.jsx`: è il prototipo funzionante approvato. Usalo come riferimento vincolante per:
- il design (stile quotidiano sportivo su carta rosa: palette #FBEDEF/#16181F/#0B6E3A/#C8102E, font Anton + Barlow Condensed + Source Serif 4, testata da giornale, tab in stile tipografico);
- la struttura delle 4 sezioni (La Gazzetta, Mercato, La Mia Squadra, Classifica);
- la logica dei prompt AI (formato JSON di articoli e proposte di scambio, validazione dei nomi dei giocatori, feed "ultim'ora" alimentato dagli scambi).

## Stack tecnico

- **Next.js** (App Router) con **TypeScript** e **Tailwind CSS**.
- Le chiamate all'AI usano l'**SDK ufficiale Anthropic** (`@anthropic-ai/sdk`) esclusivamente lato server, in API route (`/api/articles`, `/api/trades`), con modello `claude-sonnet-4-6`. La chiave API va letta da `process.env.ANTHROPIC_API_KEY` e **non deve mai finire nel client**. Crea un `.env.example` e aggiungi `.env*` al `.gitignore`.
- Persistenza: **SQLite** con Prisma (o Drizzle) per squadre, rose, giocatori, giornate, risultati, scambi e articoli. Prevedi uno script di seed con una lega dimostrativa di 6 squadre (~15 giocatori l'una, con nomi di giocatori di Serie A, quotazioni e fantamedie plausibili).
- Struttura pensata per il futuro: isola l'accesso ai dati della lega in un layer (`lib/league/`) con interfaccia astratta, così in seguito potremo sostituire il seed con un import da piattaforme reali (Leghe Fantacalcio / Fantacalcio.it) o da CSV senza toccare il resto.

## Funzionalità richieste

### La Gazzetta (Notizie)
- Pulsante "Genera l'edizione del giorno": l'API route costruisce il contesto (classifica + risultati dell'ultima giornata + eventuali scambi recenti) e chiede all'AI 4-6 articoli in JSON (`kicker`, `title`, `body`, `category`).
- Layout da prima pagina: articolo di apertura grande, gli altri in colonne.
- Gli articoli generati vengono salvati nel DB come "edizione" con data, e le edizioni passate sono consultabili in un archivio.
- Feed "Ultim'ora" in cima: notizie flash generate automaticamente quando uno scambio viene accettato o rifiutato.

### Mercato (l'Agente)
- Pulsante "Chiama l'Agente": l'API route invia le rose all'AI e riceve 3 proposte di scambio in JSON (`otherTeam`, `give`, `receive`, `rationale`, `agentComment`), 1-per-1, stesso ruolo o valore simile.
- Valida sempre lato server che i giocatori proposti esistano davvero nelle rose indicate; scarta le proposte non valide.
- Accetta/Rifiuta: se accettato, lo scambio viene eseguito nel DB (i giocatori cambiano rosa), registrato nello storico scambi, e genera una notizia flash. Se rifiutato, genera comunque una notizia di mercato saltato.
- Pagina "storico scambi" della lega.

### La Mia Squadra
- Rosa raggruppata per ruolo con quota, fantamedia, club; statistiche di sintesi (valore rosa, fantamedia media, punti).
- Evidenzia punti di forza e reparti scoperti (calcolo locale, senza AI).

### Classifica
- Classifica della lega con punti e presidente; la squadra dell'utente evidenziata.

### Simulazione giornata (per la demo)
- Un pulsante/route "Simula giornata" che genera risultati plausibili tra le squadre della lega (punteggi fantacalcio 60-85, con note su migliori/peggiori in campo), aggiorna la classifica e rende disponibile il contesto per la nuova edizione della Gazzetta. Serve a dimostrare il ciclo completo: evento → notizia → mercato.

## Qualità e vincoli

- UI in **italiano**, responsive fino a mobile, con stati di caricamento divertenti a tema ("La redazione sta scrivendo...", "L'Agente sta studiando le rose...") e gestione errori chiara con possibilità di riprovare.
- Gestisci con cura il parsing del JSON restituito dall'AI (rimuovi eventuali fence markdown, valida la struttura, fallback con messaggio d'errore).
- Scrivi un `README.md` con: setup (`npm install`, `.env`, seed, `npm run dev`), architettura, e come sostituire la lega demo con dati reali.
- Aggiungi qualche test essenziale sulla logica di validazione/esecuzione degli scambi.

Procedi passo per passo: prima lo scaffolding e il modello dati con seed, poi le pagine con dati statici, poi le due API route AI, infine rifiniture e README. Mostrami il piano prima di iniziare a scrivere codice.
