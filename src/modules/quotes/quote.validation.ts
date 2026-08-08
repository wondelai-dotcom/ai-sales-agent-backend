import { z } from "zod";

const quoteItemSchema = z.object({
  descrizione: z.string().min(1),
  quantita: z.number().int().positive().default(1),
  prezzoUnitario: z.number().nonnegative(),
});

export const createQuoteSchema = z.object({
  clientId: z.string().uuid(),
  items: z.array(quoteItemSchema).min(1),
  taxRate: z.number().nonnegative().default(22),
  validUntil: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export const updateQuoteStatusSchema = z.object({
  stato: z.enum(["BOZZA", "INVIATO", "ACCETTATO", "RIFIUTATO"]),
});
