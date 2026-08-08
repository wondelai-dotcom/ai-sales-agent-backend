import { Response } from "express";
import { AuthenticatedRequest } from "../../shared/middlewares/auth";
import { quoteService } from "./quote.service";
import { automationsService } from "../automations/automations.service";
import { createQuoteSchema, updateQuoteStatusSchema } from "./quote.validation";

export const quoteController = {
  async list(req: AuthenticatedRequest, res: Response) {
    res.json(await quoteService.list(req.auth!.companyId));
  },

  async create(req: AuthenticatedRequest, res: Response) {
    const input = createQuoteSchema.parse(req.body);
    const quote = await quoteService.create(req.auth!.companyId, input);
    res.status(201).json(quote);
  },

  async updateStatus(req: AuthenticatedRequest, res: Response) {
    const { stato } = updateQuoteStatusSchema.parse(req.body);
    await quoteService.updateStatus(req.auth!.companyId, req.params.id, stato);
    res.json({ message: "Stato aggiornato" });
  },

  async pdf(req: AuthenticatedRequest, res: Response) {
    const buffer = await quoteService.generatePdf(req.auth!.companyId, req.params.id);
    res.header("Content-Type", "application/pdf").attachment(`preventivo-${req.params.id.slice(0, 8)}.pdf`).send(buffer);
  },

  async paymentLink(req: AuthenticatedRequest, res: Response) {
    const url = await automationsService.generatePaymentLink(req.params.id);
    res.json({ url });
  },
};
