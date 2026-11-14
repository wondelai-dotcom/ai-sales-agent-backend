import { z } from "zod";

export const registerSchema = z.object({
  ragioneSociale: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(254),
  password: z.string().min(12, "La password deve avere almeno 12 caratteri").max(128),
  nome: z.string().trim().min(1).max(100),
  cognome: z.string().trim().min(1).max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1).max(8192),
});

export const requestPasswordResetSchema = z.object({
  email: z.string().trim().email().max(254),
});

export const confirmPasswordResetSchema = z.object({
  token: z.string().min(32).max(512),
  newPassword: z.string().min(12).max(128),
});

export const verifyEmailSchema = z.object({ token: z.string().min(32).max(512) });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
