import { Response } from "express";
import { AuthenticatedRequest } from "../../../shared/middlewares/auth";
import { leadService } from "./lead.service";
import { createLeadSchema, updateLeadStageSchema } from "./lead.validation";

export const leadController = {
  async list(req: AuthenticatedRequest, res: Response) {
    res.json(await leadService.list(req.auth!.companyId));
  },

  async create(req: AuthenticatedRequest, res: Response) {
    const input = createLeadSchema.parse(req.body);
    const lead = await leadService.create(req.auth!.companyId, input.clientId, input.source, input.value);
    res.status(201).json(lead);
  },

  async updateStage(req: AuthenticatedRequest, res: Response) {
    const { stage } = updateLeadStageSchema.parse(req.body);
    await leadService.updateStage(req.auth!.companyId, req.params.id, stage);
    res.status(200).json({ message: "Stato aggiornato" });
  },

  async pipelineSummary(req: AuthenticatedRequest, res: Response) {
    res.json(await leadService.pipelineSummary(req.auth!.companyId));
  },
};
