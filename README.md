# AI Sales Agent Pro — Backend

Backend del progetto (nome provvisorio "AI Sales Agent Pro", ex "AI Milano Pro"):
piattaforma SaaS multi-tenant per automatizzare la gestione clienti delle PMI
tramite AI (collaboratore virtuale che risponde ai clienti, crea preventivi,
fissa appuntamenti, aggiorna il CRM).

Stack: Node.js + Express + TypeScript, PostgreSQL + Prisma, Redis, Docker.
Architettura: moduli isolati per dominio (Auth, CRM, AI, Calendar, Billing,
WhatsApp, Notifications, Documents, Admin), ognuno con
`*.routes.ts -> *.controller.ts -> *.service.ts -> *.repository.ts`.
Il controller resta sottile, la logica vive nel service, l'accesso ai dati
e' isolato nel repository: rende ogni modulo testabile e sostituibile senza
toccare gli altri.

## Cosa e' gia' implementato

- **Schema database completo** (`prisma/schema.prisma`): tutte le tabelle
  previste (companies, users, roles, permissions, clients, leads,
  conversations, ai_messages, documents, embeddings, appointments,
  notifications, subscriptions, invoices, payments, whatsapp_messages,
  device_tokens) + `quotes` (preventivi), aggiunta necessaria non elencata
  esplicitamente nello schema originale ma richiesta dalla funzionalita'
  "Preventivi".
- **Modulo Auth**: registrazione azienda + utente Owner, login, refresh
  token (rotazione con hash in DB), logout, richiesta/conferma reset
  password, RBAC su 4 ruoli (Owner/Admin/Manager/Operatore). Verifica email
  e MFA sono predisposte nello schema ma non ancora implementate (MFA è
  esplicitamente "futura" nella spec originale).
- **Modulo CRM (clienti + lead)**: CRUD clienti con ricerca/paginazione,
  esportazione CSV, pipeline lead (Nuovo → Contattato → Preventivo →
  Appuntamento → Venduto → Follow-up) con endpoint di riepilogo per la
  dashboard.
- **Modulo Calendario**: CRUD appuntamenti, controllo orari di lavoro
  (di default Lun-Sab 8-18, da rendere configurabile per company quando
  serve davvero differenziarlo) e controllo sovrapposizioni per evitare
  doppie prenotazioni sullo stesso slot.
- **Modulo Preventivi**: CRUD preventivi, cambio stato (Bozza → Inviato →
  Accettato/Rifiutato), **generazione PDF reale** (non uno stub) con
  `pdfkit`: `GET /api/quotes/:id/pdf` restituisce il PDF generato al volo.
  Il campo `Quote.pdfUrl` resta vuoto finche' non e' configurato lo storage
  S3-compatible: quando lo sara', basta caricare il buffer gia' generato e
  salvare l'URL, senza toccare il resto del modulo.
- **Modulo Company**: `GET/PATCH /api/company` per i dati azienda
  (ragione sociale, telefono, link recensioni Google, ore di anticipo
  promemoria, prompt AI personalizzato) e `GET/POST/PATCH/DELETE
  /api/company/services` per il listino servizi strutturato — con
  distinzione tra servizi a **prezzo fisso** e servizi **da diagnosi**
  (es. un idraulico non può quotare a scatola chiusa una perdita non
  identificata): il modulo AI usa questa distinzione per proporre una
  fascia + sopralluogo invece di un numero secco sui servizi da diagnosi.
- **Preventivi ristrutturati a voci multiple**: `Quote` ora ha una
  relazione `QuoteItem[]` (descrizione, quantità, prezzo unitario) invece
  di un singolo servizio/importo, con `taxRate` e calcolo di
  imponibile/IVA/totale — allineato al modello già usato dal sito
  ai-office-manager collegato a queste API.
- **Modulo AI**: `POST /api/ai/message` riceve un messaggio cliente,
  recupera lo storico conversazione + i chunk di documenti aziendali
  indicizzati + il listino strutturato, chiama OpenAI con un system
  prompt costruito da `ai.prompt.ts`, e se l'AI decide azioni (crea
  preventivo, fissa appuntamento, aggiorna stato lead) le esegue
  chiamando i service degli altri moduli — mai Prisma direttamente, cosi'
  le regole di business restano in un solo posto. **Non funziona finche'
  `OPENAI_API_KEY` non e' impostata** (errore chiaro 503, non un crash
  silenzioso). Il RAG e' minimo: recupera gli ultimi chunk indicizzati
  senza vera similarity search, in attesa della decisione su pgvector vs
  vector DB dedicato (vedi sotto).
- **Modulo AI esteso**: oltre a `POST /api/ai/message`, ora espone anche
  `GET /api/ai/conversations` e `GET /api/ai/conversations/:id` (lista e
  dettaglio, con storico messaggi) e `POST
  /api/ai/conversations/:id/messages` (messaggio manuale di un operatore
  umano nella stessa conversazione) — usati dalla pagina Conversazioni
  del sito ai-office-manager collegato a queste API.
- **Infrastruttura condivisa**: middleware di autenticazione JWT,
  isolamento multi-tenant (ogni query e' filtrata per `companyId` a livello
  di repository), RBAC, rate limiting (generale + stringente su
  login/registrazione), gestione errori centralizzata, Helmet, Docker +
  docker-compose (Postgres + Redis + backend), OpenAPI di base.

## Cosa e' ancora uno stub

I moduli `billing`, `whatsapp`, `notifications`, `documents`, `admin`
esistono come file con un unico service vuoto e un commento che descrive
cosa deve fare e come si collega al resto (vedi i file stessi in
`src/modules/*/**.service.ts`). Non sono ancora collegati alle routes ne'
a fornitori esterni.

## Come avviarlo in locale

```bash
cp .env.example .env          # poi compila almeno JWT_ACCESS_SECRET/JWT_REFRESH_SECRET
docker compose up -d postgres redis
npm install
npm run prisma:migrate
npx tsx prisma/seed.ts        # crea i ruoli (obbligatorio prima del primo register)
npm run dev
```

L'API risponde su `http://localhost:4000`. Healthcheck: `GET /health`.

## Cosa manca prima di poter davvero "girare"

Nessuna chiave delle integrazioni esterne e' ancora configurata (come mi
avevi detto): OpenAI, Stripe, Firebase, WhatsApp Business (Meta). Finche'
non ci sono, i moduli che dipendono da esse restano stub — non e' un
blocco per continuare a sviluppare Calendar/Preventivi, ma lo diventa per
AI/WhatsApp/Billing/Notifiche push.

## Roadmap realistica verso settembre

Con un solo sviluppatore (o un piccolo team) e partendo da zero il 23
luglio, arrivare a **tutta** la piattaforma descritta nella spec
originale (mobile Flutter completo + dashboard web + 8 moduli backend +
4 integrazioni esterne) per fine settembre non è un obiettivo realistico.
E' invece realistico arrivare a un **MVP funzionante e dimostrabile** se si
taglia con decisione tutto cio' che non è strettamente necessario a
validare il prodotto con i primi clienti reali (es. Bianco Facile).

**Decisione presa**: al posto dell'app nativa Flutter, il prodotto sara'
un sito web responsive (dashboard React estesa a PWA, installabile su
home screen). Elimina uno dei rischi di calendario piu' seri verso
settembre (revisione App Store/Play Store) e riduce a un solo codebase
da mantenere invece di due.

Piano indicativo, 10 settimane (23/07 → 30/09):

| Settimane | Obiettivo |
|---|---|
| 1–2 | ✅ Fatto: schema DB, Auth, CRM+pipeline, infrastruttura base |
| 3–4 | ✅ Fatto: modulo Calendar (CRUD appuntamenti + disponibilita' + anti-doppie prenotazioni) e Preventivi (CRUD + generazione PDF reale) |
| 5–6 | ✅ Fatto (parte codice): modulo AI — chat + esecuzione azioni su CRM/Calendar/Preventivi. Resta da fare: RAG con vera similarity search (dipende dalla decisione sul vector DB) e da testare con la chiave OpenAI reale, non ancora disponibile |
| 7 | Integrazione WhatsApp Cloud API (ricezione/risposta, collegata al modulo AI) — **avviare la verifica Meta Business ora**, non quando si arriva a questa settimana: i tempi di approvazione corrono in parallelo allo sviluppo, non dopo |
| 8 | Billing con Stripe (piano unico all'inizio, non 3 piani + webhook completi) — **avviare l'attivazione dell'account Stripe ora**, stesso motivo |
| 9 | Dashboard web (React) essenziale: le schermate gia' previste ma solo le viste collegate a moduli reali |
| 10 | Estensione responsive/PWA della dashboard web (installabile su home screen, funzionamento offline parziale) al posto dell'app Flutter nativa — elimina i tempi di revisione App Store/Play Store dal percorso critico |

Cose esplicitamente rimandate a dopo settembre (gia' cosi' nella spec
originale, sezione "Versione 2"): Voice AI, telefonate AI, analytics
avanzati, workflow automatici, multi lingua, MFA, sincronizzazione Google
Calendar, scalabilita' a 10.000 aziende (l'architettura la supporta, ma
va validata sotto carico solo dopo l'MVP).

## Automazioni che generano fatturato (modulo `automations`)

Preventivi/Calendario/CRM da soli sono "organizzazione" — utili ma
sostituibili con carta e penna. Le 5 automazioni sotto sono quelle per cui
un artigiano paga davvero un abbonamento, perché toccano soldi che oggi
perde (pattern usati da Jobber, Housecall Pro, ServiceTitan nel mercato
field-service USA):

1. **Chiamata persa → risposta automatica immediata** (`POST
   /api/automations/missed-call`): l'automazione a più alto impatto.
   Richiede un provider di telefonia (es. Twilio Voice) collegato al
   numero dell'azienda — non ancora integrato, ma tutto il flusso a valle
   (registrazione chiamata, testo pronto, collegamento al cliente CRM se
   il numero è noto) è già scritto e testabile.
2. **Promemoria appuntamento** (`POST /api/automations/run-reminders`):
   riduce i no-show, ore di lavoro pagate zero per un tecnico che arriva
   e non trova nessuno.
3. **Richiesta recensione dopo lavoro completato** (`POST
   /api/automations/run-review-requests`): richiede aver impostato
   `Company.googleReviewUrl`. Le recensioni sono il marketing principale
   di un artigiano locale.
4. **Manutenzione ricorrente** (`GET /api/automations/maintenance-due`):
   non manda nulla in automatico al cliente (rischia di sembrare invadente
   senza supervisione), genera invece una lista di clienti da ricontattare
   per un servizio che tipicamente si ripete (es. manutenzione annuale
   caldaia) — fatturato che oggi va perso perché quasi nessun artigiano
   lo fa sistematicamente.
5. **Link di pagamento dopo il lavoro** (`POST
   /api/quotes/:id/payment-link`): stub in attesa della chiave Stripe
   reale, interfaccia già pronta in `modules/billing`.

**Come schedularle in produzione**: per l'MVP, un cron esterno (es.
cron-job.org o il cron di Render) che chiama gli endpoint 2-4
periodicamente per ogni azienda attiva è sufficiente — non serve
introdurre subito un sistema di job scheduling più complesso (il passo
naturale successivo, quando le aziende crescono, è BullMQ su Redis, già
presente nello stack).

## Prima di avere clienti paganti reali (non e' solo codice)

L'obiettivo dichiarato e' arrivare ai primi clienti paganti reali entro
settembre, non solo una demo. Oltre al codice, servono cose che il codice
da solo non risolve:

- **Fatturazione elettronica**: obbligatoria in Italia per B2B, Stripe da
  solo non la copre — va deciso come integrarla (commercialista o un
  gestionale di fatturazione con API).
- **Privacy Policy, Termini di Servizio, informativa GDPR**: il prodotto
  tratta dati personali reali (i clienti dei clienti). Queste vanno
  scritte/validate da un professionista legale, non generate senza
  supervisione.
- **Sicurezza e backup verificati con dati veri**, non solo in teoria
  sullo schema.
- **Un solo cliente pagante reale come primo target** (es. Bianco Facile)
  e' molto piu' raggiungibile per settembre che "clienti paganti" al
  plurale su scala: conviene validare tutto con un caso reale prima di
  aprire ad altri.

## Decisioni ancora aperte

- Provider di storage S3-compatible (AWS S3, Cloudflare R2, MinIO
  self-hosted?) — impatta il modulo Documents.
- Provider di hosting per produzione (impatta CI/CD in GitHub Actions,
  non ancora scritto).
- Se il vector database per il RAG sara' pgvector dentro lo stesso
  Postgres (piu' semplice da gestire, consigliato per l'MVP) oppure un
  servizio dedicato (Pinecone/Qdrant) — nello schema attuale `Embedding.vector`
  e' un campo `Json` proprio per restare agnostico finche' non si decide.

## Authentication documentation

Detailed documentation of the implemented authentication flow, endpoints, token handling, security review and test plan is available in [`docs/auth/`](docs/auth/AUTHENTICATION.md):

- [Authentication overview](docs/auth/AUTHENTICATION.md)
- [Request flows](docs/auth/AUTH_FLOW.md)
- [Token and credential security](docs/auth/TOKEN_SECURITY.md)
- [Authentication API reference](docs/auth/API_AUTH.md)
- [Security review and production gaps](docs/auth/SECURITY_REVIEW.md)
- [Authentication testing guide](docs/auth/AUTH_TESTING.md)
