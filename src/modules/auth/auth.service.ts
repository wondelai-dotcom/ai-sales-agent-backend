import { AppError } from "../../shared/errors/AppError";
import { generateRandomToken, hashPassword, hashToken, verifyPassword } from "../../shared/utils/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../shared/utils/jwt";
import { authRepository } from "./auth.repository";
import { LoginInput, RegisterInput } from "./auth.validation";

// Tutta la logica di business dell'autenticazione vive qui.
// Il controller resta uno strato sottile che valida l'input e chiama il service:
// questo rende il service testabile senza dover montare Express.
export const authService = {
  async register(input: RegisterInput) {
    const existing = await authRepository.findUserByEmail(input.email);
    if (existing) {
      throw AppError.conflict("Esiste gia' un account con questa email");
    }

    const ownerRole = await authRepository.findRoleByName("OWNER");
    if (!ownerRole) {
      // Le righe di Role vanno seminate una tantum (vedi prisma/seed.ts, TODO).
      throw new AppError("Ruolo OWNER non configurato: eseguire il seed del database", 500, "SEED_MISSING");
    }

    const passwordHash = await hashPassword(input.password);

    const { company, user } = await authRepository.createCompanyWithOwner({
      ragioneSociale: input.ragioneSociale,
      companyEmail: input.email,
      ownerEmail: input.email,
      passwordHash,
      nome: input.nome,
      cognome: input.cognome,
      ownerRoleId: ownerRole.id,
    });

    // TODO: inviare email di verifica (modules/notifications) prima del rilascio in produzione.

    return this.issueTokens(user.id, company.id, user.roleId, "OWNER");
  },

  async login(input: LoginInput) {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user || !user.isActive) {
      throw AppError.unauthorized("Credenziali non valide");
    }

    const passwordOk = await verifyPassword(input.password, user.passwordHash);
    if (!passwordOk) {
      throw AppError.unauthorized("Credenziali non valide");
    }

    return this.issueTokens(user.id, user.companyId, user.roleId, user.role.name);
  },

  async refresh(refreshToken: string) {
    let payload: { sub: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw AppError.unauthorized("Refresh token non valido o scaduto");
    }

    const user = await authRepository.findUserById(payload.sub);
    if (!user || !user.isActive || !user.refreshTokenHash) {
      throw AppError.unauthorized("Sessione non valida");
    }

    const presentedHash = hashToken(refreshToken);
    if (user.refreshTokenHash !== presentedHash) {
      throw AppError.unauthorized("Sessione non valida, effettuare nuovamente il login");
    }

    // Compare-and-swap prevents two concurrent requests from successfully
    // rotating the same refresh token (replay/race protection).
    const accessToken = signAccessToken({
      sub: user.id,
      companyId: user.companyId,
      roleId: user.roleId,
      roleName: user.role.name,
    });
    const nextRefreshToken = signRefreshToken(user.id);
    const rotated = await authRepository.rotateRefreshTokenHash(
      user.id,
      presentedHash,
      hashToken(nextRefreshToken)
    );
    if (!rotated) {
      throw AppError.unauthorized("Refresh token già utilizzato; effettuare nuovamente il login");
    }
    return { accessToken, refreshToken: nextRefreshToken };
  },

  async logout(userId: string) {
    await authRepository.setRefreshTokenHash(userId, null);
  },

  async me(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw AppError.notFound("Utente non trovato");
    return {
      id: user.id,
      email: user.email,
      nome: user.nome,
      cognome: user.cognome,
      companyId: user.companyId,
      ruolo: user.role.name,
    };
  },

  async requestPasswordReset(email: string) {
    const user = await authRepository.findUserByEmail(email);
    // Risposta sempre "ok" anche se l'utente non esiste, per non rivelare
    // quali email sono registrate (evita enumeration attack).
    if (!user) return;

    const rawToken = generateRandomToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minuti
    await authRepository.setResetToken(user.id, hashToken(rawToken), expiresAt);

    // TODO: inviare rawToken via email (modules/notifications), mai loggarlo in chiaro.
  },

  async confirmPasswordReset(token: string, newPassword: string) {
    const user = await authRepository.findByResetTokenHash(hashToken(token));
    if (!user) {
      throw AppError.unauthorized("Token di reset non valido o scaduto");
    }
    const passwordHash = await hashPassword(newPassword);
    await authRepository.updatePasswordAndClearReset(user.id, passwordHash);
  },

  async issueTokens(userId: string, companyId: string, roleId: string, roleName: string) {
    const accessToken = signAccessToken({ sub: userId, companyId, roleId, roleName });
    const refreshToken = signRefreshToken(userId);
    await authRepository.setRefreshTokenHash(userId, hashToken(refreshToken));
    return { accessToken, refreshToken };
  },
};
