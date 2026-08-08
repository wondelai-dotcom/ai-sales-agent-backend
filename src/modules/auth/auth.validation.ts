import { z } from "zod";

export const registerSchema = z.object({
  ragioneSociale: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8, "La password deve avere almeno 8 caratteri"),
  nome: z.string().min(1),
  cognome: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const requestPasswordResetSchema = z.object({
  email: z.string().email(),
});

export const confirmPasswordResetSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
