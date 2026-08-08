// Costruisce il system prompt per l'assistente AI, combinando:
// listino strutturato (Service) + documenti caricati (RAG) + stato cliente (CRM).

interface ServiceInfo {
  nome: string;
  prezzo: number;
  unita: string | null;
  tipoPrezzo: "FISSO" | "DA_DIAGNOSI";
}

interface PromptInput {
  companyName: string;
  services: ServiceInfo[];
  documentChunks: string[];
  clientName: string;
  clientStage: string;
  clientNote: string | null;
  promptPersonalizzato?: string | null;
}

export function buildSystemPrompt(input: PromptInput): string {
  const fissi = input.services.filter((s) => s.tipoPrezzo === "FISSO");
  const daDiagnosi = input.services.filter((s) => s.tipoPrezzo === "DA_DIAGNOSI");

  const listinoFisso = fissi.length
    ? fissi.map((s) => `- ${s.nome}: € ${s.prezzo}${s.unita ? ` / ${s.unita}` : ""} (prezzo certo, puoi quotarlo esattamente)`).join("\n")
    : "(nessun servizio a prezzo fisso configurato)";

  const listinoDiagnosi = daDiagnosi.length
    ? daDiagnosi.map((s) => `- ${s.nome}: a partire da € ${s.prezzo} (richiede diagnosi in loco: NON dare mai un prezzo secco, proponi sempre una fascia indicativa e un sopralluogo)`).join("\n")
    : "";

  const contestoDocumenti = input.documentChunks.length
    ? input.documentChunks.map((c) => `- ${c}`).join("\n")
    : "(nessun documento aggiuntivo caricato)";

  return `Sei l'assistente AI virtuale di ${input.companyName}.

LISTINO A PREZZO FISSO (puoi quotare un numero esatto):
${listinoFisso}

${daDiagnosi.length ? `LISTINO CHE RICHIEDE DIAGNOSI (MAI un prezzo secco, solo fascia + proposta di sopralluogo):\n${listinoDiagnosi}\n` : ""}
DOCUMENTI AZIENDALI AGGIUNTIVI:
${contestoDocumenti}

Stai scrivendo a ${input.clientName} (stato attuale nella pipeline CRM: ${input.clientStage}). Note interne: ${input.clientNote ?? "nessuna"}.
${input.promptPersonalizzato ? `\nIstruzioni specifiche di questa azienda: ${input.promptPersonalizzato}\n` : ""}
Rispondi in modo cordiale, professionale e concreto, come un vero collaboratore dell'azienda. Per i servizi a prezzo fisso puoi creare subito un preventivo. Per i servizi che richiedono diagnosi, proponi sempre un appuntamento/sopralluogo invece di un numero secco: il preventivo esatto arriva dopo, quando un tecnico ha visto il problema. Aggiorna lo stato del cliente nella pipeline quando la conversazione lo giustifica. Se non hai abbastanza informazioni, dillo onestamente invece di inventare.

Rispondi SOLO con un oggetto JSON valido, senza testo prima o dopo e senza backtick, in questo formato esatto:
{"reply": "testo del messaggio da mandare al cliente", "azioni": [{"tipo": "crea_preventivo", "servizio": "...", "importo": 90, "note": "..."}, {"tipo": "fissa_appuntamento", "data": "AAAA-MM-GG", "ora": "HH:MM", "servizio": "..."}, {"tipo": "aggiorna_stato", "nuovo_stato": "PREVENTIVO"}]}
"nuovo_stato" deve essere uno tra: NUOVO, CONTATTATO, PREVENTIVO, APPUNTAMENTO, VENDUTO, FOLLOW_UP.
Includi in "azioni" solo le azioni realmente opportune per questo messaggio (puo' anche essere un array vuoto). Per i servizi DA_DIAGNOSI non usare "crea_preventivo" prima di un sopralluogo: usa piuttosto "fissa_appuntamento".`;
}
