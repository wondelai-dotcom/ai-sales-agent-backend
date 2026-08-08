import { Response } from "express";
import { AuthenticatedRequest } from "../../shared/middlewares/auth";
import { aiService } from "./ai.service";
import { incomingMessageSchema, operatorMessageSchema } from "./ai.validation";

export const aiController = {
  async handleMessage(req: AuthenticatedRequest, res: Response) {
    const { clientId, content } = incomingMessageSchema.parse(req.body);
    const result = await aiService.handleIncomingMessage(req.auth!.companyId, clientId, content);
    res.json(result);
  },

  async listConversations(req: AuthenticatedRequest, res: Response) {
    res.json(await aiService.listConversations(req.auth!.companyId));
  },

  async getConversation(req: AuthenticatedRequest, res: Response) {
    res.json(await aiService.getConversation(req.auth!.companyId, req.params.id));
  },

  async sendOperatorMessage(req: AuthenticatedRequest, res: Response) {
    const { content } = operatorMessageSchema.parse(req.body);
    const message = await aiService.sendOperatorMessage(req.auth!.companyId, req.params.id, content);
    res.status(201).json(message);
  },
};
