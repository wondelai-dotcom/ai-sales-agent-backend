import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
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

  if (env.trustProxy > 0) app.set("trust proxy", env.trustProxy);
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      // Requests without Origin include server-to-server calls and health probes.
      if (!origin || env.nodeEnv !== "production" || env.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin non autorizzata dalla policy CORS"));
    },
    credentials: false,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  }));
  app.use(express.json({ limit: "1mb", strict: true }));
  app.use(express.urlencoded({ extended: false, limit: "1mb" }));
  app.use(apiRateLimiter);

  app.get("/health/live", (_req, res) => res.status(200).json({ status: "ok" }));
  app.get("/health/ready", async (_req, res) => {
    try {
      const { prisma } = await import("./shared/db/prisma");
      await prisma.$queryRaw`SELECT 1`;
      return res.status(200).json({ status: "ready" });
    } catch {
      return res.status(503).json({ status: "not_ready" });
    }
  });

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
