import { z } from "zod";

export const LEAD_STAGES = ["NUOVO", "CONTATTATO", "PREVENTIVO", "APPUNTAMENTO", "VENDUTO", "FOLLOW_UP"] as const;

export const createLeadSchema = z.object({
  clientId: z.string().uuid(),
  source: z.string().optional(),
  value: z.number().optional(),
});

export const updateLeadStageSchema = z.object({
  stage: z.enum(LEAD_STAGES),
});
