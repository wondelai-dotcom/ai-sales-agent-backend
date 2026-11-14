import { prisma } from "../../shared/db/prisma";

export const appointmentRepository = {
  list: (companyId: string, from?: Date, to?: Date) =>
    prisma.appointment.findMany({
      where: {
        companyId,
        ...(from || to ? { dataOra: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
      },
      include: { client: true },
      orderBy: { dataOra: "asc" },
    }),

  // Controlla sovrapposizioni per evitare doppie prenotazioni sullo stesso slot.
  findOverlapping: async (companyId: string, start: Date, end: Date) => {
    const candidates = await prisma.appointment.findMany({
      where: {
        companyId,
        stato: { not: "ANNULLATO" },
        dataOra: { lt: end, gte: new Date(start.getTime() - 8 * 60 * 60 * 1000) },
      },
      select: { dataOra: true, durataMin: true },
    });
    return candidates.find((candidate) =>
      candidate.dataOra.getTime() + candidate.durataMin * 60 * 1000 > start.getTime()
    ) ?? null;
  },

  create: (companyId: string, data: { clientId: string; titolo: string; dataOra: Date; durataMin: number; note?: string }) =>
    prisma.appointment.create({ data: { ...data, companyId } }),

  findById: (companyId: string, id: string) => prisma.appointment.findFirst({ where: { id, companyId } }),

  updateStatus: (companyId: string, id: string, stato: string) =>
    prisma.appointment.updateMany({ where: { id, companyId }, data: { stato: stato as never } }),
};
