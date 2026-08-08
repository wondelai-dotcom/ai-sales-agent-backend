import { prisma } from "../../../shared/db/prisma";

export const leadRepository = {
  listByCompany: (companyId: string) =>
    prisma.lead.findMany({ where: { companyId }, include: { client: true }, orderBy: { updatedAt: "desc" } }),

  findById: (companyId: string, id: string) => prisma.lead.findFirst({ where: { id, companyId } }),

  create: (companyId: string, clientId: string, source?: string, value?: number) =>
    prisma.lead.create({ data: { companyId, clientId, source, value } }),

  updateStage: (companyId: string, id: string, stage: string) =>
    prisma.lead.updateMany({ where: { id, companyId }, data: { stage: stage as never } }),

  countByStage: (companyId: string) =>
    prisma.lead.groupBy({ by: ["stage"], where: { companyId }, _count: { _all: true } }),
};
