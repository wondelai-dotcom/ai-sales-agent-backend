import { AppError } from "../../../shared/errors/AppError";
import { leadRepository } from "./lead.repository";
import { clientRepository } from "../clients/client.repository";

export const leadService = {
  list: (companyId: string) => leadRepository.listByCompany(companyId),

  async create(companyId: string, clientId: string, source?: string, value?: number) {
    const client = await clientRepository.findById(companyId, clientId);
    if (!client) throw AppError.notFound("Cliente non trovato");
    return leadRepository.create(companyId, clientId, source, value);
  },

  async updateStage(companyId: string, id: string, stage: string) {
    const result = await leadRepository.updateStage(companyId, id, stage);
    if (result.count === 0) throw AppError.notFound("Lead non trovato");
  },

  // Alimenta il grafico "Clienti per fase della pipeline" mostrato in dashboard.
  pipelineSummary: (companyId: string) => leadRepository.countByStage(companyId),
};
