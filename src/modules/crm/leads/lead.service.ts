import { AppError } from "../../../shared/errors/AppError";
import { leadRepository } from "./lead.repository";

export const leadService = {
  list: (companyId: string) => leadRepository.listByCompany(companyId),

  create: (companyId: string, clientId: string, source?: string, value?: number) =>
    leadRepository.create(companyId, clientId, source, value),

  async updateStage(companyId: string, id: string, stage: string) {
    const result = await leadRepository.updateStage(companyId, id, stage);
    if (result.count === 0) throw AppError.notFound("Lead non trovato");
  },

  // Alimenta il grafico "Clienti per fase della pipeline" mostrato in dashboard.
  pipelineSummary: (companyId: string) => leadRepository.countByStage(companyId),
};
