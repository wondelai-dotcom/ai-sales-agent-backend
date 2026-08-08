import { z } from "zod";

export const missedCallSchema = z.object({
  clientPhone: z.string().min(6),
});
