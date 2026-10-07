# Mettere online il backend (versione semplificata)

Niente Redis e niente Shell: tabelle e ruoli si creano da soli a ogni avvio.

## 1. Database
Crea un database PostgreSQL gratuito (per esempio su neon.tech o su Render)
e copia l'URL di connessione: sarà il valore di `DATABASE_URL`.

## 2. Servizio web (Render)
1. New > Web Service, collega questo repository GitHub.
2. Runtime: **Docker** (usa il Dockerfile).
3. Environment Variables, copia i nomi da `.env.example`:
   - `DATABASE_URL`
   - `JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET` (due stringhe diverse, minimo 32 caratteri)
   - `OPENAI_API_KEY` (se vuoi la chat AI attiva)
4. Create Web Service e aspetta il primo avvio (qualche minuto).

## 3. Verifica
Apri `https://IL-TUO-SERVIZIO.onrender.com/health`: deve rispondere `{"status":"ok"}`.
Poi prova `POST /api/auth/register` (vedi `docs/openapi.yaml`).

## Se qualcosa non va
Apri i **Logs** del servizio su Render e copia le ultime 30 righe.
