import { describe, expect, it } from "vitest";
import { confirmPasswordResetSchema, loginSchema, registerSchema, refreshSchema, verifyEmailSchema } from "./auth.validation";

describe("authentication input validation", () => {
  it("normalizes accepted whitespace at the schema boundary without silently accepting invalid email", () => {
    expect(loginSchema.safeParse({ email: " user@example.com ", password: "pass" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "not-an-email", password: "pass" }).success).toBe(false);
  });

  it("requires strong new passwords and bounded token values", () => {
    expect(registerSchema.safeParse({ ragioneSociale: "Acme", email: "a@b.com", password: "short", nome: "A", cognome: "B" }).success).toBe(false);
    expect(confirmPasswordResetSchema.safeParse({ token: "x".repeat(32), newPassword: "long-enough-password" }).success).toBe(true);
    expect(refreshSchema.safeParse({ refreshToken: "x".repeat(9000) }).success).toBe(false);
    expect(verifyEmailSchema.safeParse({ token: "x".repeat(32) }).success).toBe(true);
  });
});
