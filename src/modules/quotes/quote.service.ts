import { AppError } from "../../shared/errors/AppError";
import { quoteRepository } from "./quote.repository";
import { generateQuotePdf } from "./quote.pdf";
import { clientRepository } from "../crm/clients/client.repository";

function generateNumero(progressivo: number): string {
  const now = new Date();
  return `PRV-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${1000 + progressivo}`;
}

export const quoteService = {
  list: (companyId: string) => quoteRepository.list(companyId),

  async create(
    companyId: string,
    input: {
      clientId: string;
      items: { descrizione: string; quantita: number; prezzoUnitario: number }[];
      taxRate: number;
      validUntil?: Date;
      notes?: string;
    }
  ) {
    const client = await clientRepository.findById(companyId, input.clientId);
    if (!client) throw AppError.notFound("Cliente non trovato");
    const count = await quoteRepository.countForCompany(companyId);
    const numero = generateNumero(count + 1);
    return quoteRepository.create(companyId, { ...input, numero });
  },

  async updateStatus(companyId: string, id: string, stato: string) {
    const result = await quoteRepository.updateStatus(companyId, id, stato);
    if (result.count === 0) throw AppError.notFound("Preventivo non trovato");
  },

  async generatePdf(companyId: string, id: string): Promise<Buffer> {
    const quote = await quoteRepository.findById(companyId, id);
    if (!quote) throw AppError.notFound("Preventivo non trovato");

    const clientName = quote.client.ragioneSociale || `${quote.client.nome} ${quote.client.cognome ?? ""}`.trim();

    return generateQuotePdf({
      companyName: quote.company.ragioneSociale,
      clientName,
      numero: quote.numero,
      items: quote.items.map((i) => ({
        descrizione: i.descrizione,
        quantita: i.quantita,
        prezzoUnitario: Number(i.prezzoUnitario),
      })),
      taxRate: Number(quote.taxRate),
      data: quote.createdAt,
    });
  },
};
