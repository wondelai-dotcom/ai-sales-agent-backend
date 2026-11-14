import { z } from "zod";

export const LEAD_STAGES = ["NUOVO", "CONTATTATO", "PREVENTIVO", "APPUNTAMENTO", "VENDUTO", "FOLLOW_UP", "PERSO"] as const;

export const createLeadSchema = z.object({
  clientId: z.string().uuid(),
  source: z.string().max(100).optional(),
  value: z.number().finite().nonnegative().optional(),
});

export const updateLeadStageSchema = z.object({
  stage: z.enum(LEAD_STAGES),
});
