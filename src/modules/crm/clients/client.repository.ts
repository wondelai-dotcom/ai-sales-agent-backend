import { Prisma } from "@prisma/client";
import { prisma } from "../../../shared/db/prisma";

export const clientRepository = {
  // companyId e' SEMPRE il primo filtro: e' la garanzia di isolamento multi-tenant.
  list: (companyId: string, params: { search?: string; tag?: string; skip: number; take: number }) => {
    const where: Prisma.ClientWhereInput = {
      companyId,
      ...(params.tag ? { tag: { has: params.tag } } : {}),
      ...(params.search
        ? {
            OR: [
              { nome: { contains: params.search, mode: "insensitive" } },
              { cognome: { contains: params.search, mode: "insensitive" } },
              { ragioneSociale: { contains: params.search, mode: "insensitive" } },
              { email: { contains: params.search, mode: "insensitive" } },
              { telefono: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    return prisma.$transaction([
      prisma.client.findMany({ where, skip: params.skip, take: params.take, orderBy: { createdAt: "desc" } }),
      prisma.client.count({ where }),
    ]);
  },

  findById: (companyId: string, id: string) => prisma.client.findFirst({ where: { id, companyId } }),

  create: (companyId: string, data: Omit<Prisma.ClientUncheckedCreateInput, "companyId">) =>
    prisma.client.create({ data: { ...data, companyId } }),

  update: (companyId: string, id: string, data: Prisma.ClientUpdateInput) =>
    prisma.client.updateMany({ where: { id, companyId }, data }),

  remove: (companyId: string, id: string) => prisma.client.deleteMany({ where: { id, companyId } }),

  findAllForExport: (companyId: string) =>
    prisma.client.findMany({ where: { companyId }, orderBy: { createdAt: "desc" } }),
};
