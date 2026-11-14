import { z } from "zod";

export const createAppointmentSchema = z.object({
  clientId: z.string().uuid(),
  titolo: z.string().trim().min(1).max(200),
  dataOra: z.coerce.date(),
  durataMin: z.number().int().min(15).max(480).default(60),
  note: z.string().max(5000).optional(),
});

export const updateAppointmentStatusSchema = z.object({
  stato: z.enum(["PROPOSTO", "CONFERMATO", "COMPLETATO", "ANNULLATO"]),
});

export const listAppointmentsQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
}).refine((value) => !value.from || !value.to || value.from <= value.to, {
  message: "from deve essere precedente o uguale a to",
});
