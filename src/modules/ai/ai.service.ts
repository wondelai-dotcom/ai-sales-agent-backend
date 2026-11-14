import OpenAI from "openai";
import { AppError } from "../../shared/errors/AppError";
import { env } from "../../config/env";
import { aiRepository } from "./ai.repository";
import { buildSystemPrompt } from "./ai.prompt";
import { leadRepository } from "../crm/leads/lead.repository";
import { quoteService } from "../quotes/quote.service";
import { appointmentService } from "../calendar/appointment.service";

interface AiAction {
  tipo: "crea_preventivo" | "fissa_appuntamento" | "aggiorna_stato";
  servizio?: string;
  importo?: number;
  note?: string;
  data?: string;
  ora?: string;
  nuovo_stato?: string;
}

interface AiResponse {
  reply: string;
  azioni: AiAction[];
}

// Client OpenAI creato pigramente: se la chiave non e' ancora configurata
// (vedi README, chiave in attesa), l'errore emerge solo quando si prova
// davvero a usare la chat, non all'avvio del server.
function getOpenAiClient(): OpenAI {
  if (!env.integrations.openaiApiKey) {
    throw new AppError(
      "OPENAI_API_KEY non configurata: il modulo AI non puo' rispondere finche' la chiave non e' impostata",
      503,
      "AI_NOT_CONFIGURED"
    );
  }
  return new OpenAI({ apiKey: env.integrations.openaiApiKey });
}

function parseAiJson(raw: string): AiResponse {
  const clean = raw.replace(/```json|```/g, "").trim();
  try {
    const parsed = JSON.parse(clean);
    return { reply: parsed.reply ?? "", azioni: Array.isArray(parsed.azioni) ? parsed.azioni : [] };
  } catch {
    return { reply: raw || "Mi scuso, non sono riuscito a elaborare una risposta.", azioni: [] };
  }
}

export const aiService = {
  async handleIncomingMessage(companyId: string, clientId: string, content: string) {
    const client = await aiRepository.getClient(companyId, clientId);
    if (!client) throw AppError.notFound("Cliente non trovato");

    const company = await aiRepository.getCompany(companyId);
    if (!company) throw AppError.notFound("Azienda non trovata");

    const conversation = await aiRepository.findOrCreateConversation(companyId, clientId);
    await aiRepository.saveMessage(conversation.id, "CLIENTE", content);

    const history = (await aiRepository.recentMessages(conversation.id)).reverse();
    const documentChunks = (await aiRepository.latestDocumentChunks(companyId)).map((e) => e.chunkText);
    const services = (await aiRepository.listServices(companyId)).map((s) => ({
      nome: s.nome,
      prezzo: Number(s.prezzo),
      unita: s.unita,
      tipoPrezzo: s.tipoPrezzo,
    }));

    const leads = await leadRepository.listByCompany(companyId);
    const clientLead = leads.find((l) => l.clientId === clientId);

    const systemPrompt = buildSystemPrompt({
      companyName: company.ragioneSociale,
      services,
      documentChunks,
      clientName: `${client.nome} ${client.cognome ?? ""}`.trim(),
      clientStage: clientLead?.stage ?? "NUOVO",
      clientNote: client.note,
      promptPersonalizzato: company.promptPersonalizzato,
    });

    const conversationText = history.map((m) => `${m.sender === "CLIENTE" ? "Cliente" : "AI"}: ${m.content}`).join("\n");

    const openai = getOpenAiClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Cronologia recente:\n${conversationText}\n\nRispondi all'ultimo messaggio del cliente.` },
      ],
      temperature: 0.4,
    });

    const rawText = completion.choices[0]?.message?.content ?? "";
    const parsed = parseAiJson(rawText);

    await aiRepository.saveMessage(conversation.id, "AI", parsed.reply, parsed.azioni);

    // Never let an LLM perform financial or scheduling side effects autonomously.
    // Actions are returned as proposals until a dedicated human-approval workflow exists.
    return {
      reply: parsed.reply,
      azioniInAttesaDiApprovazione: parsed.azioni,
      azioniEseguite: [],
    };
  },

  // Esegue le azioni decise dall'AI chiamando i service degli altri moduli:
  // il modulo AI non tocca mai Prisma direttamente per CRM/Calendar/Quotes,
  // passa sempre dai loro service, cosi' le regole di business (es. controllo
  // orari in appointmentService, isolamento tenant) restano in un solo posto.
  async executeActions(companyId: string, clientId: string, azioni: AiAction[]) {
    const eseguite: string[] = [];

    for (const az of azioni) {
      try {
        if (az.tipo === "crea_preventivo" && az.servizio && typeof az.importo === "number") {
          await quoteService.create(companyId, {
            clientId,
            items: [{ descrizione: az.servizio, quantita: 1, prezzoUnitario: az.importo }],
            taxRate: 22,
          });
          eseguite.push(`Preventivo creato: ${az.servizio} – €${az.importo}`);
        }

        if (az.tipo === "fissa_appuntamento" && az.data && az.ora && az.servizio) {
          await appointmentService.create(companyId, {
            clientId,
            titolo: az.servizio,
            dataOra: new Date(`${az.data}T${az.ora}:00`),
            durataMin: 60,
          });
          eseguite.push(`Appuntamento fissato: ${az.servizio} il ${az.data} alle ${az.ora}`);
        }

        if (az.tipo === "aggiorna_stato" && az.nuovo_stato) {
          const leads = await leadRepository.listByCompany(companyId);
          const lead = leads.find((l) => l.clientId === clientId);
          if (lead) {
            await leadRepository.updateStage(companyId, lead.id, az.nuovo_stato);
            eseguite.push(`Stato aggiornato a "${az.nuovo_stato}"`);
          }
        }
      } catch (err) {
        // Un'azione che fallisce (es. slot calendario gia' occupato) non deve
        // far perdere la risposta testuale gia' data al cliente: la logghiamo
        // e continuiamo con le altre azioni.
        console.error("Errore nell'esecuzione di un'azione AI:", az, err);
      }
    }

    return eseguite;
  },

  listConversations(companyId: string) {
    return aiRepository.listConversations(companyId);
  },

  async getConversation(companyId: string, id: string) {
    const conv = await aiRepository.getConversationWithMessages(companyId, id);
    if (!conv) throw AppError.notFound("Conversazione non trovata");
    return conv;
  },

  async sendOperatorMessage(companyId: string, conversationId: string, content: string) {
    const conv = await aiRepository.getConversationWithMessages(companyId, conversationId);
    if (!conv) throw AppError.notFound("Conversazione non trovata");
    return aiRepository.saveMessage(conversationId, "OPERATORE", content);
  },
};
