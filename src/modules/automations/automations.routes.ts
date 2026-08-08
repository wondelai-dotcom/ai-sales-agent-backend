import { Router } from "express";
import { requireAuth } from "../../shared/middlewares/auth";
import { automationsController } from "./automations.controller";

export const automationsRouter = Router();

automationsRouter.use(requireAuth);

// In produzione questo endpoint riceve il webhook dal provider di telefonia
// (es. Twilio Voice) quando una chiamata non ha risposta. Per ora e' protetto
// dallo stesso JWT degli altri endpoint; quando si collega un provider reale,
// va aggiunta una verifica firma webhook dedicata (non il JWT utente).
automationsRouter.post("/missed-call", automationsController.missedCall);

// Endpoint pensati per essere chiamati da un cron esterno (vedi nota in
// automations.service.ts) oppure manualmente per test/demo.
automationsRouter.post("/run-reminders", automationsController.runReminders);
automationsRouter.post("/run-review-requests", automationsController.runReviewRequests);
automationsRouter.get("/maintenance-due", automationsController.checkMaintenance);
