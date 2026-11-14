import { beforeEach, describe, expect, it, vi } from "vitest";

const { repository, mailer } = vi.hoisted(() => ({
  repository: {
    findUserByEmail: vi.fn(),
    findRoleByName: vi.fn(),
    createCompanyWithOwner: vi.fn(),
    setEmailVerificationToken: vi.fn(),
    consumeEmailVerificationToken: vi.fn(),
    consumeResetToken: vi.fn(),
  },
  mailer: { sendTransactionalEmail: vi.fn() },
}));
vi.mock("./auth.repository", () => ({ authRepository: repository }));
vi.mock("../../shared/services/email", () => mailer);

import { authService } from "./auth.service";

describe("auth service one-time token flows", () => {
  beforeEach(() => vi.clearAllMocks());

  it("accepts a valid email verification token through atomic consumption", async () => {
    repository.consumeEmailVerificationToken.mockResolvedValue(true);
    await expect(authService.verifyEmail("a".repeat(64))).resolves.toBeUndefined();
    expect(repository.consumeEmailVerificationToken).toHaveBeenCalledOnce();
  });

  it("rejects expired, unknown or already-consumed email verification tokens", async () => {
    repository.consumeEmailVerificationToken.mockResolvedValue(false);
    await expect(authService.verifyEmail("b".repeat(64))).rejects.toMatchObject({ statusCode: 401 });
  });

  it("delegates password reset to an atomic one-time token consumption", async () => {
    repository.consumeResetToken.mockResolvedValue(true);
    await expect(authService.confirmPasswordReset("c".repeat(64), "a-strong-password-value")).resolves.toBeUndefined();
    expect(repository.consumeResetToken).toHaveBeenCalledOnce();
  });

  it("rejects a reset token that has expired or was already consumed", async () => {
    repository.consumeResetToken.mockResolvedValue(false);
    await expect(authService.confirmPasswordReset("d".repeat(64), "a-strong-password-value")).rejects.toMatchObject({ statusCode: 401 });
  });
});
