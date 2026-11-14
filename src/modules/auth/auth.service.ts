import { AppError } from "../../shared/errors/AppError";
import { generateRandomToken, hashPassword, hashToken, verifyPassword } from "../../shared/utils/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../shared/utils/jwt";
import { authRepository } from "./auth.repository";
import { env } from "../../config/env";
import { sendTransactionalEmail } from "../../shared/services/email";
import { LoginInput, RegisterInput } from "./auth.validation";

function escapeHtml(value: string) { return value.replace(/[&<>"\']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"' : "&quot;", "\'": "&#39;" }[c] ?? c)); }

export const authService = {
  async register(input: RegisterInput) {
    const email = input.email.trim().toLowerCase();
    if (await authRepository.findUserByEmail(email)) {
      throw AppError.conflict("Esiste già un account con questa email");
    }
    const ownerRole = await authRepository.findRoleByName("OWNER");
    if (!ownerRole) throw new AppError("Ruolo OWNER non configurato: eseguire il seed", 500, "SEED_MISSING");

    const passwordHash = await hashPassword(input.password);
    const { company, user } = await authRepository.createCompanyWithOwner({
      ragioneSociale: input.ragioneSociale,
      companyEmail: email,
      ownerEmail: email,
      passwordHash,
      nome: input.nome,
      cognome: input.cognome,
      ownerRoleId: ownerRole.id,
    });
    const verificationToken = generateRandomToken();
    await authRepository.setEmailVerificationToken(user.id, hashToken(verificationToken), new Date(Date.now() + 24 * 60 * 60 * 1000));
    const verifyUrl = `${env.email.appBaseUrl}/verify-email?token=${encodeURIComponent(verificationToken)}`;
    await sendTransactionalEmail({
      to: email,
      subject: "Conferma il tuo indirizzo email",
      html: `<p>Ciao ${escapeHtml(input.nome)},</p><p>Conferma il tuo indirizzo email entro 24 ore:</p><p><a href="${verifyUrl}">Verifica email</a></p>`,
    });
    return this.issueTokens(user.id, company.id, user.roleId, "OWNER", user.tokenVersion);
  },

  async login(input: LoginInput) {
    const email = input.email.trim().toLowerCase();
    const user = await authRepository.findUserByEmail(email);
    if (!user || !user.isActive) throw AppError.unauthorized("Credenziali non valide");
    if (!user.emailVerifiedAt) throw AppError.forbidden("Conferma il tuo indirizzo email prima di accedere");
    if (!(await verifyPassword(input.password, user.passwordHash))) {
      throw AppError.unauthorized("Credenziali non valide");
    }
    return this.issueTokens(user.id, user.companyId, user.roleId, user.role.name, user.tokenVersion);
  },

  async refresh(refreshToken: string) {
    let payload: { sub: string };
    try { payload = verifyRefreshToken(refreshToken); }
    catch { throw AppError.unauthorized("Refresh token non valido o scaduto"); }

    const user = await authRepository.findUserById(payload.sub);
    if (!user || !user.isActive || !user.refreshTokenHash) throw AppError.unauthorized("Sessione non valida");
    const presentedHash = hashToken(refreshToken);
    if (user.refreshTokenHash !== presentedHash) throw AppError.unauthorized("Sessione non valida, effettuare nuovamente il login");

    const nextRefreshToken = signRefreshToken(user.id);
    const rotated = await authRepository.rotateRefreshTokenHash(user.id, presentedHash, hashToken(nextRefreshToken));
    if (!rotated) throw AppError.unauthorized("Refresh token già utilizzato; effettuare nuovamente il login");
    const accessToken = signAccessToken({
      sub: user.id, companyId: user.companyId, roleId: user.roleId,
      roleName: user.role.name, tokenVersion: user.tokenVersion,
    });
    return { accessToken, refreshToken: nextRefreshToken };
  },

  async logout(userId: string) {
    await authRepository.revokeSessions(userId);
  },

  async me(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw AppError.notFound("Utente non trovato");
    return { id: user.id, email: user.email, nome: user.nome, cognome: user.cognome, companyId: user.companyId, ruolo: user.role.name };
  },

  async requestPasswordReset(emailInput: string) {
    const user = await authRepository.findUserByEmail(emailInput.trim().toLowerCase());
    if (!user) return;
    const rawToken = generateRandomToken();
    await authRepository.setResetToken(user.id, hashToken(rawToken), new Date(Date.now() + 30 * 60 * 1000));
    const resetUrl = `${env.email.appBaseUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
    await sendTransactionalEmail({
      to: user.email,
      subject: "Reimposta la tua password",
      html: `<p>Hai richiesto di reimpostare la password.</p><p><a href="${resetUrl}">Reimposta password</a></p><p>Il collegamento scade tra 30 minuti. Se non hai richiesto tu il reset, ignora questa email.</p>`,
    });
  },

  async verifyEmail(token: string) {
    const verified = await authRepository.consumeEmailVerificationToken(hashToken(token));
    if (!verified) throw AppError.unauthorized("Token di verifica non valido o scaduto");
  },

  async confirmPasswordReset(token: string, newPassword: string) {
    const passwordHash = await hashPassword(newPassword);
    const consumed = await authRepository.consumeResetToken(hashToken(token), passwordHash);
    if (!consumed) throw AppError.unauthorized("Token di reset non valido o scaduto");
  },

  async issueTokens(userId: string, companyId: string, roleId: string, roleName: string, tokenVersion = 0) {
    const accessToken = signAccessToken({ sub: userId, companyId, roleId, roleName, tokenVersion });
    const refreshToken = signRefreshToken(userId);
    await authRepository.setRefreshTokenHash(userId, hashToken(refreshToken));
    return { accessToken, refreshToken };
  },
};
