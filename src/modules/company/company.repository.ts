import { prisma } from "../../shared/db/prisma";

export const companyRepository = {
  findById: (companyId: string) => prisma.company.findUnique({ where: { id: companyId } }),

  update: (companyId: string, data: Parameters<typeof prisma.company.update>[0]["data"]) =>
    prisma.company.update({ where: { id: companyId }, data }),

  listServices: (companyId: string) => prisma.service.findMany({ where: { companyId }, orderBy: { createdAt: "asc" } }),

  createService: (companyId: string, data: { nome: string; prezzo: number; unita?: string; tipoPrezzo: "FISSO" | "DA_DIAGNOSI" }) =>
    prisma.service.create({ data: { ...data, companyId } }),

  updateService: (companyId: string, id: string, data: Partial<{ nome: string; prezzo: number; unita: string; tipoPrezzo: "FISSO" | "DA_DIAGNOSI" }>) =>
    prisma.service.updateMany({ where: { id, companyId }, data }),

  deleteService: (companyId: string, id: string) => prisma.service.deleteMany({ where: { id, companyId } }),
};
