# Come mettere online il backend (quando sarai pronto)

Questa guida presuppone zero esperienza di deploy. Segui i passaggi in ordine.

## Prima di iniziare, ti servono:

1. Una **chiave OpenAI** (platform.openai.com) — senza questa il modulo AI
   risponde con un errore chiaro, non con un crash, ma non funziona.
2. Un account su un servizio di hosting. Consigliato per iniziare:
   **Render.com** (ha un piano gratuito/economico, supporta Docker e
   Postgres senza configurazioni complesse).
3. Un account GitHub (per caricare il codice, gratuito).

## Passo 1 — Carica il codice su GitHub

1. Crea un account su github.com se non ce l'hai già
2. Crea un nuovo repository (es. "ai-sales-agent-backend")
3. Carica dentro la cartella `backend` che trovi in questo zip
   (su github.com puoi trascinare i file direttamente dal browser,
   sezione "Add file" → "Upload files")

## Passo 2 — Crea il database su Render

1. Su render.com, "New" → "PostgreSQL" → scegli il piano gratuito
2. Copia la "Internal Database URL" che ti mostra: ti servirà dopo

## Passo 3 — Crea il servizio Redis su Render

1. "New" → "Redis" → piano gratuito
2. Copia anche qui l'URL di connessione

## Passo 4 — Crea il Web Service

1. "New" → "Web Service" → collega il repository GitHub creato al Passo 1
2. Runtime: Docker (Render riconosce automaticamente il Dockerfile)
3. In "Environment Variables" inserisci, una per una, le variabili che
   trovi nel file `.env.example`:
   - `DATABASE_URL` → l'URL copiato al Passo 2
   - `REDIS_URL` → l'URL copiato al Passo 3
   - `JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET` → due stringhe lunghe e
     casuali qualsiasi (es. generale su random.org, almeno 32 caratteri)
   - `OPENAI_API_KEY` → la tua chiave OpenAI
   - Le altre (Stripe, WhatsApp, Firebase, S3) puoi lasciarle vuote per
     ora: i moduli che le usano restano stub finché non le imposti
4. Clicca "Create Web Service": Render fa la build e l'avvio da solo

## Passo 5 — Prepara il database

Una volta che il servizio è online, da Render apri la "Shell" del Web
Service (pulsante nella dashboard) ed esegui:

```bash
npm run prisma:migrate
npx tsx prisma/seed.ts
```

Questo crea le tabelle e i ruoli di base (senza il seed, non puoi
registrare la prima azienda).

## Passo 6 — Verifica che funzioni

Apri l'URL che Render ti assegna, aggiungendo `/health` alla fine
(es. `https://tuo-servizio.onrender.com/health`). Deve rispondere
`{"status":"ok"}`.

## Cosa NON è ancora incluso in questi passaggi

- La dashboard web (React) e il sito responsive/PWA: questo backend è
  solo l'API, senza interfaccia grafica propria — va costruita e
  distribuita separatamente (prossimo passo del piano).
- Fatturazione elettronica, Privacy Policy/GDPR: vedi la sezione
  dedicata nel README, richiedono un professionista.

Se ti blocchi a un passaggio qualsiasi, torna qui e dimmi esattamente
dove sei arrivato e cosa vedi sullo schermo — ti guido dal punto esatto.
