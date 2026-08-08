import { prisma } from "../../shared/db/prisma";

export const automationsRepository = {
  // ---- Chiamate perse ----
  createMissedCall: (companyId: string, clientPhone: string, clientId?: string) =>
    prisma.missedCall.create({ data: { companyId, clientPhone, clientId } }),

  markTextBackSent: (id: string) => prisma.missedCall.update({ where: { id }, data: { textBackSentAt: new Date() } }),

  findClientByPhone: (companyId: string, phone: string) => prisma.client.findFirst({ where: { companyId, telefono: phone } }),

  // ---- Promemoria appuntamento (riduce i no-show) ----
  findAppointmentsNeedingReminder: (companyId: string, withinHours: number) => {
    const now = new Date();
    const until = new Date(now.getTime() + withinHours * 60 * 60 * 1000);
    return prisma.appointment.findMany({
      where: { companyId, stato: { in: ["PROPOSTO", "CONFERMATO"] }, dataOra: { gte: now, lte: until }, reminderSentAt: null },
      include: { client: true },
    });
  },
  markReminderSent: (id: string) => prisma.appointment.update({ where: { id }, data: { reminderSentAt: new Date() } }),

  // ---- Richiesta recensione dopo lavoro completato ----
  findCompletedAppointmentsNeedingReview: (companyId: string) =>
    prisma.appointment.findMany({
      where: { companyId, stato: "COMPLETATO", reviewRequestSentAt: null },
      include: { client: true },
    }),
  markReviewRequestSent: (id: string) => prisma.appointment.update({ where: { id }, data: { reviewRequestSentAt: new Date() } }),

  // ---- Manutenzione ricorrente (es. controllo annuale) ----
  findRecurringServicesDue: (companyId: string, monthsAgo: number) => {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - monthsAgo);
    return prisma.appointment.findMany({
      where: { companyId, isRecurringService: true, stato: "COMPLETATO", dataOra: { lte: cutoff } },
      include: { client: true },
    });
  },

  getCompany: (companyId: string) => prisma.company.findUnique({ where: { id: companyId } }),
};
