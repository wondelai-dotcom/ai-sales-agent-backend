import cors from "cors";
import express from "express";
import helmet from "helmet";
import { errorHandler, notFoundHandler } from "./shared/middlewares/errorHandler";
import { apiRateLimiter } from "./shared/middlewares/rateLimit";
import { authRouter } from "./modules/auth/auth.routes";
import { clientRouter } from "./modules/crm/clients/client.routes";
import { leadRouter } from "./modules/crm/leads/lead.routes";
import { appointmentRouter } from "./modules/calendar/appointment.routes";
import { quoteRouter } from "./modules/quotes/quote.routes";
import { aiRouter } from "./modules/ai/ai.routes";
import { automationsRouter } from "./modules/automations/automations.routes";
import { companyRouter } from "./modules/company/company.routes";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(apiRateLimiter);

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  // Ogni modulo espone il proprio router: aggiungere qui i nuovi moduli
  // (calendar, ai, billing, whatsapp, notifications, admin) quando
  // smettono di essere stub, senza toccare gli altri.
  app.use("/api/auth", authRouter);
  app.use("/api/clients", clientRouter);
  app.use("/api/leads", leadRouter);
  app.use("/api/appointments", appointmentRouter);
  app.use("/api/quotes", quoteRouter);
  app.use("/api/ai", aiRouter);
  app.use("/api/automations", automationsRouter);
  app.use("/api/company", companyRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
