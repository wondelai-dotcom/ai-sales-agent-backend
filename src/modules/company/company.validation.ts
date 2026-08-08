import { z } from "zod";

export const updateCompanySchema = z.object({
  ragioneSociale: z.string().min(1).optional(),
  telefono: z.string().optional(),
  logoUrl: z.string().optional(),
  googleReviewUrl: z.string().url().optional(),
  reminderHoursBefore: z.number().int().min(1).max(72).optional(),
  maintenanceFollowUpMonths: z.number().int().min(1).max(60).optional(),
});

export const createServiceSchema = z.object({
  nome: z.string().min(1),
  prezzo: z.number().nonnegative(),
  unita: z.string().optional(),
  tipoPrezzo: z.enum(["FISSO", "DA_DIAGNOSI"]).default("FISSO"),
});

export const updateServiceSchema = createServiceSchema.partial();
