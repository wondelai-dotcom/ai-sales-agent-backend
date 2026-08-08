import { prisma } from "../../shared/db/prisma";

// Isola tutto l'accesso a Prisma per il dominio Auth: service e controller
// non toccano mai prisma direttamente, cosi' il modulo resta testabile
// (repository facilmente sostituibile con un mock nei test).
export const authRepository = {
  findRoleByName: (name: "OWNER" | "ADMIN" | "MANAGER" | "OPERATOR") =>
    prisma.role.findUnique({ where: { name } }),

  findUserByEmail: (companyEmail: string) =>
    prisma.user.findFirst({
      where: { email: companyEmail },
      include: { role: true },
    }),

  findUserById: (id: string) =>
    prisma.user.findUnique({ where: { id }, include: { role: true } }),

  createCompanyWithOwner: (params: {
    ragioneSociale: string;
    companyEmail: string;
    ownerEmail: string;
    passwordHash: string;
    nome: string;
    cognome: string;
    ownerRoleId: string;
  }) =>
    prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: { ragioneSociale: params.ragioneSociale, email: params.companyEmail },
      });
      const user = await tx.user.create({
        data: {
          companyId: company.id,
          email: params.ownerEmail,
          passwordHash: params.passwordHash,
          nome: params.nome,
          cognome: params.cognome,
          roleId: params.ownerRoleId,
        },
        include: { role: true },
      });
      return { company, user };
    }),

  setRefreshTokenHash: (userId: string, refreshTokenHash: string | null) =>
    prisma.user.update({ where: { id: userId }, data: { refreshTokenHash } }),

  setResetToken: (userId: string, resetTokenHash: string, expiresAt: Date) =>
    prisma.user.update({ where: { id: userId }, data: { resetTokenHash, resetTokenExpiresAt: expiresAt } }),

  findByResetTokenHash: (resetTokenHash: string) =>
    prisma.user.findFirst({ where: { resetTokenHash, resetTokenExpiresAt: { gt: new Date() } } }),

  updatePasswordAndClearReset: (userId: string, passwordHash: string) =>
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash, resetTokenHash: null, resetTokenExpiresAt: null },
    }),
};
