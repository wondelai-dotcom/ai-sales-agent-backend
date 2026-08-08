import { prisma } from "../../shared/db/prisma";

export const quoteRepository = {
  list: (companyId: string) =>
    prisma.quote.findMany({ where: { companyId }, include: { client: true, items: true }, orderBy: { createdAt: "desc" } }),

  findById: (companyId: string, id: string) =>
    prisma.quote.findFirst({ where: { id, companyId }, include: { client: true, company: true, items: true } }),

  countForCompany: (companyId: string) => prisma.quote.count({ where: { companyId } }),

  create: (
    companyId: string,
    data: {
      clientId: string;
      numero: string;
      taxRate: number;
      validUntil?: Date;
      notes?: string;
      items: { descrizione: string; quantita: number; prezzoUnitario: number }[];
    }
  ) =>
    prisma.quote.create({
      data: {
        companyId,
        clientId: data.clientId,
        numero: data.numero,
        taxRate: data.taxRate,
        validUntil: data.validUntil,
        notes: data.notes,
        items: { create: data.items },
      },
      include: { client: true, items: true },
    }),

  updateStatus: (companyId: string, id: string, stato: string) =>
    prisma.quote.updateMany({ where: { id, companyId }, data: { stato: stato as never } }),

  setPdfUrl: (id: string, pdfUrl: string) => prisma.quote.update({ where: { id }, data: { pdfUrl } }),
};
