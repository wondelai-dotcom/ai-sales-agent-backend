import { z } from "zod";

export const createAppointmentSchema = z.object({
  clientId: z.string().uuid(),
  titolo: z.string().min(1),
  dataOra: z.coerce.date(),
  durataMin: z.number().int().min(15).max(480).default(60),
  note: z.string().optional(),
});

export const updateAppointmentStatusSchema = z.object({
  stato: z.enum(["PROPOSTO", "CONFERMATO", "COMPLETATO", "ANNULLATO"]),
});

export const listAppointmentsQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
