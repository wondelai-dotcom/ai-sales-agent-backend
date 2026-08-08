import { z } from "zod";

export const createClientSchema = z.object({
  nome: z.string().min(1),
  cognome: z.string().optional(),
  ragioneSociale: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email().optional(),
  indirizzo: z.string().optional(),
  fonte: z.string().optional(),
  stato: z.enum(["ATTIVO", "INATTIVO", "POTENZIALE"]).default("ATTIVO"),
  tag: z.array(z.string()).default([]),
  note: z.string().optional(),
});

export const updateClientSchema = createClientSchema.partial();

export const listClientsQuerySchema = z.object({
  search: z.string().optional(),
  tag: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
