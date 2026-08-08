import { AppError } from "../../../shared/errors/AppError";
import { clientRepository } from "./client.repository";

export const clientService = {
  async list(companyId: string, query: { search?: string; tag?: string; page: number; pageSize: number }) {
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await clientRepository.list(companyId, {
      search: query.search,
      tag: query.tag,
      skip,
      take: query.pageSize,
    });
    return { items, total, page: query.page, pageSize: query.pageSize };
  },

  async getById(companyId: string, id: string) {
    const client = await clientRepository.findById(companyId, id);
    if (!client) throw AppError.notFound("Cliente non trovato");
    return client;
  },

  create(companyId: string, data: Parameters<typeof clientRepository.create>[1]) {
    return clientRepository.create(companyId, data);
  },

  async update(companyId: string, id: string, data: Parameters<typeof clientRepository.update>[2]) {
    const result = await clientRepository.update(companyId, id, data);
    if (result.count === 0) throw AppError.notFound("Cliente non trovato");
    return this.getById(companyId, id);
  },

  async remove(companyId: string, id: string) {
    const result = await clientRepository.remove(companyId, id);
    if (result.count === 0) throw AppError.notFound("Cliente non trovato");
  },

  async exportCsv(companyId: string) {
    const clients = await clientRepository.findAllForExport(companyId);
    const header = "nome,cognome,ragioneSociale,telefono,email,tag,note\n";
    const rows = clients
      .map((c) =>
        [c.nome, c.cognome ?? "", c.ragioneSociale ?? "", c.telefono ?? "", c.email ?? "", c.tag.join("|"), c.note ?? ""]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    return header + rows;
  },
};
