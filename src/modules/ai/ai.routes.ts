import { Router } from "express";
import { requireAuth } from "../../shared/middlewares/auth";
import { aiController } from "./ai.controller";

export const aiRouter = Router();

// Endpoint di test per la chat web (usato anche dalla dashboard per
// simulare/validare le risposte prima di collegare WhatsApp in Fase 4).
aiRouter.use(requireAuth);
aiRouter.post("/message", aiController.handleMessage);
aiRouter.get("/conversations", aiController.listConversations);
aiRouter.get("/conversations/:id", aiController.getConversation);
aiRouter.post("/conversations/:id/messages", aiController.sendOperatorMessage);
