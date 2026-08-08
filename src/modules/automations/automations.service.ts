import { automationsRepository } from "./automations.repository";
import { AppError } from "../../shared/errors/AppError";

// Queste 5 automazioni sono il motivo per cui un artigiano paga un
// abbonamento: non "organizzazione", ma soldi che oggi perde e che con
// questo recupera. Ogni funzione qui e' pensata per essere chiamata da
// un job schedulato (cron) in produzione — vedi note in fondo al file —
// oltre che dagli endpoint manuali esposti in automations.routes.ts
// (utili per test e per la demo).

export const automationsService = {
  // 1) CHIAMATA PERSA -> RISPOSTA AUTOMATICA IMMEDIATA
  // L'automazione a piu' alto impatto sul fatturato: un artigiano che lavora
  // non risponde al telefono, quella chiamata va al concorrente in pochi
  // secondi senza questo. Richiede un provider di telefonia (es. Twilio
  // Voice) collegato al numero dell'azienda che manda qui un webhook quando
  // una chiamata non ha risposta. Il modulo whatsapp (stub, in attesa delle
  // credenziali Meta) e' quello che poi invia davvero il messaggio.
  async handleMissedCall(companyId: string, clientPhone: string) {
    const client = await automationsRepository.findClientByPhone(companyId, clientPhone);
    const missedCall = await automationsRepository.createMissedCall(companyId, clientPhone, client?.id);

    const company = await automationsRepository.getCompany(companyId);
    const testo = `Ciao! Sono l'assistente di ${company?.ragioneSociale ?? "l'azienda"}. ` +
      `Abbiamo visto la sua chiamata, al momento siamo impegnati su un intervento. ` +
      `Mi scriva pure qui il problema e le rispondo subito, oppure la richiamiamo appena possibile.`;

    // TODO(whatsapp): quando il modulo whatsapp e' collegato a Meta Cloud API,
    // sostituire con whatsappService.sendMessage(clientPhone, testo).
    // Per ora logghiamo l'intento, cosi' il flusso e' testabile end-to-end
    // (missed call -> record -> testo pronto) anche senza le credenziali.
    console.log(`[missed-call] invierei a ${clientPhone}: ${testo}`);

    await automationsRepository.markTextBackSent(missedCall.id);
    return { missedCallId: missedCall.id, testoInviato: testo, clientTrovato: !!client };
  },

  // 2) PROMEMORIA APPUNTAMENTO -> RIDUCE I NO-SHOW
  // Un tecnico che arriva e non trova nessuno perde ore di lavoro pagate zero.
  async sendAppointmentReminders(companyId: string) {
    const company = await automationsRepository.getCompany(companyId);
    if (!company) throw AppError.notFound("Azienda non trovata");

    const appuntamenti = await automationsRepository.findAppointmentsNeedingReminder(companyId, company.reminderHoursBefore);
    const risultati: string[] = [];

    for (const a of appuntamenti) {
      const testo = `Promemoria: appuntamento "${a.titolo}" oggi alle ${a.dataOra.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}. A presto!`;
      // TODO(whatsapp): whatsappService.sendMessage(a.client.telefono, testo)
      console.log(`[reminder] invierei a ${a.client.telefono}: ${testo}`);
      await automationsRepository.markReminderSent(a.id);
      risultati.push(`Promemoria inviato a ${a.client.nome} ${a.client.cognome ?? ""}`.trim());
    }
    return risultati;
  },

  // 3) RICHIESTA RECENSIONE DOPO LAVORO COMPLETATO
  // Le recensioni sono il marketing principale di un artigiano locale.
  async sendReviewRequests(companyId: string) {
    const company = await automationsRepository.getCompany(companyId);
    if (!company) throw AppError.notFound("Azienda non trovata");
    if (!company.googleReviewUrl) {
      // Non e' un errore bloccante: semplicemente non c'e' ancora nulla da
      // proporre. L'azienda deve prima impostare il link dalle Impostazioni.
      return { inviate: 0, nota: "Nessun googleReviewUrl configurato per l'azienda" };
    }

    const completati = await automationsRepository.findCompletedAppointmentsNeedingReview(companyId);
    const risultati: string[] = [];

    for (const a of completati) {
      const testo = `Grazie per averci scelto! Se è rimasto soddisfatto, ci farebbe piacere una recensione: ${company.googleReviewUrl}`;
      // TODO(whatsapp): whatsappService.sendMessage(a.client.telefono, testo)
      console.log(`[review-request] invierei a ${a.client.telefono}: ${testo}`);
      await automationsRepository.markReviewRequestSent(a.id);
      risultati.push(`Richiesta recensione inviata a ${a.client.nome} ${a.client.cognome ?? ""}`.trim());
    }
    return { inviate: risultati.length, dettaglio: risultati };
  },

  // 4) MANUTENZIONE RICORRENTE -> FATTURATO CHE OGGI VA PERSO
  // Un cliente a cui hai sostituito la caldaia va richiamato tra 12 mesi:
  // quasi nessun artigiano lo fa sistematicamente. Qui non creiamo un
  // messaggio automatico al cliente (rischia di sembrare invadente se non
  // supervisionato), ma un lead pronto per l'artigiano da contattare.
  async checkRecurringMaintenance(companyId: string) {
    const company = await automationsRepository.getCompany(companyId);
    if (!company) throw AppError.notFound("Azienda non trovata");

    const scaduti = await automationsRepository.findRecurringServicesDue(companyId, company.maintenanceFollowUpMonths);
    return scaduti.map((a) => ({
      cliente: `${a.client.nome} ${a.client.cognome ?? ""}`.trim(),
      telefono: a.client.telefono,
      ultimoServizio: a.titolo,
      dataUltimoServizio: a.dataOra,
      suggerimento: `Contattare per proporre: ${a.titolo} (ultima volta ${a.dataOra.toLocaleDateString("it-IT")})`,
    }));
  },

  // 5) LINK DI PAGAMENTO DOPO IL LAVORO -> INCASSA PIU' VELOCE
  // Stub in attesa della chiave Stripe reale (vedi modules/billing):
  // l'interfaccia e' gia' pronta cosi' che collegarla sia solo questione
  // di sostituire il corpo della funzione, non di riscrivere chi la chiama.
  async generatePaymentLink(_quoteId: string): Promise<string> {
    throw new AppError(
      "Generazione link di pagamento non disponibile: manca la chiave Stripe (vedi modules/billing)",
      503,
      "BILLING_NOT_CONFIGURED"
    );
  },
};

// NOTA SU COME SCHEDULARE QUESTE FUNZIONI IN PRODUZIONE:
// sendAppointmentReminders e sendReviewRequests vanno chiamate periodicamente
// (es. ogni 15-30 minuti) per ogni company attiva. Il modo piu' semplice per
// l'MVP e' un cron job esterno (es. cron-job.org o un cron di Render) che
// chiama gli endpoint POST /api/automations/*, protetti da un token interno,
// invece di introdurre subito un sistema di job scheduling piu' complesso
// (es. BullMQ su Redis, che e' gia' nello stack e sarebbe il passo successivo
// naturale quando il numero di aziende cresce).
