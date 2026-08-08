import { AppError } from "../../shared/errors/AppError";
import { companyRepository } from "./company.repository";

export const companyService = {
  async get(companyId: string) {
    const company = await companyRepository.findById(companyId);
    if (!company) throw AppError.notFound("Azienda non trovata");
    const services = await companyRepository.listServices(companyId);
    return { ...company, services };
  },

  update: (companyId: string, data: Parameters<typeof companyRepository.update>[1]) =>
    companyRepository.update(companyId, data),

  listServices: (companyId: string) => companyRepository.listServices(companyId),

  createService: (companyId: string, data: Parameters<typeof companyRepository.createService>[1]) =>
    companyRepository.createService(companyId, data),

  async updateService(companyId: string, id: string, data: Parameters<typeof companyRepository.updateService>[2]) {
    const result = await companyRepository.updateService(companyId, id, data);
    if (result.count === 0) throw AppError.notFound("Servizio non trovato");
  },

  async deleteService(companyId: string, id: string) {
    const result = await companyRepository.deleteService(companyId, id);
    if (result.count === 0) throw AppError.notFound("Servizio non trovato");
  },
};
