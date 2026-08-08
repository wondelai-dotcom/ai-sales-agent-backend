import { Response } from "express";
import { AuthenticatedRequest } from "../../shared/middlewares/auth";
import { automationsService } from "./automations.service";
import { missedCallSchema } from "./automations.validation";

export const automationsController = {
  async missedCall(req: AuthenticatedRequest, res: Response) {
    const { clientPhone } = missedCallSchema.parse(req.body);
    const result = await automationsService.handleMissedCall(req.auth!.companyId, clientPhone);
    res.status(201).json(result);
  },

  async runReminders(req: AuthenticatedRequest, res: Response) {
    const result = await automationsService.sendAppointmentReminders(req.auth!.companyId);
    res.json({ promemoriaInviati: result.length, dettaglio: result });
  },

  async runReviewRequests(req: AuthenticatedRequest, res: Response) {
    const result = await automationsService.sendReviewRequests(req.auth!.companyId);
    res.json(result);
  },

  async checkMaintenance(req: AuthenticatedRequest, res: Response) {
    const result = await automationsService.checkRecurringMaintenance(req.auth!.companyId);
    res.json({ clientiDaContattare: result.length, dettaglio: result });
  },
};
