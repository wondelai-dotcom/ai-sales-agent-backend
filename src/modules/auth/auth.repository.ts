import { prisma } from "../../shared/db/prisma";

// Isola tutto l'accesso a Prisma per il dominio Auth: service e controller
// non toccano mai prisma direttamente, cosi' il modulo resta testabile
// (repository facilmente sostituibile con un mock nei test).
export const authRepository = {
  findRoleByName: (name: "OWNER" | "ADMIN" | "MANAGER" | "OPERATOR") =>
    prisma.role.findUnique({ where: { name } }),

  findUserByEmail: (email: string) =>
    prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
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

  revokeSessions: (userId: string) =>
    prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null, tokenVersion: { increment: 1 } },
    }),

  rotateRefreshTokenHash: async (userId: string, expectedHash: string, nextHash: string) => {
    const result = await prisma.user.updateMany({
      where: { id: userId, refreshTokenHash: expectedHash, isActive: true },
      data: { refreshTokenHash: nextHash },
    });
    return result.count === 1;
  },

  setResetToken: (userId: string, resetTokenHash: string, expiresAt: Date) =>
    prisma.user.update({ where: { id: userId }, data: { resetTokenHash, resetTokenExpiresAt: expiresAt } }),

  consumeResetToken: async (resetTokenHash: string, passwordHash: string) => {
    const result = await prisma.user.updateMany({
      where: { resetTokenHash, resetTokenExpiresAt: { gt: new Date() } },
      data: {
        passwordHash,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
        refreshTokenHash: null,
        tokenVersion: { increment: 1 },
      },
    });
    return result.count === 1;
  },

  updatePasswordAndClearReset: (userId: string, passwordHash: string) =>
    prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
        refreshTokenHash: null,
        tokenVersion: { increment: 1 },
      },
    }),
};
