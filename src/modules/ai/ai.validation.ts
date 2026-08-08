import { z } from "zod";

export const incomingMessageSchema = z.object({
  clientId: z.string().uuid(),
  content: z.string().min(1),
});

export const operatorMessageSchema = z.object({
  content: z.string().min(1),
});
