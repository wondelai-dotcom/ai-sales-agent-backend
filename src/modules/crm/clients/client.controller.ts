import { Response } from "express";
import { AuthenticatedRequest } from "../../../shared/middlewares/auth";
import { clientService } from "./client.service";
import { createClientSchema, listClientsQuerySchema, updateClientSchema } from "./client.validation";

export const clientController = {
  async list(req: AuthenticatedRequest, res: Response) {
    const query = listClientsQuerySchema.parse(req.query);
    const result = await clientService.list(req.auth!.companyId, query);
    res.json(result);
  },

  async getById(req: AuthenticatedRequest, res: Response) {
    const client = await clientService.getById(req.auth!.companyId, req.params.id);
    res.json(client);
  },

  async create(req: AuthenticatedRequest, res: Response) {
    const input = createClientSchema.parse(req.body);
    const client = await clientService.create(req.auth!.companyId, input);
    res.status(201).json(client);
  },

  async update(req: AuthenticatedRequest, res: Response) {
    const input = updateClientSchema.parse(req.body);
    const client = await clientService.update(req.auth!.companyId, req.params.id, input);
    res.json(client);
  },

  async remove(req: AuthenticatedRequest, res: Response) {
    await clientService.remove(req.auth!.companyId, req.params.id);
    res.status(204).send();
  },

  async exportCsv(req: AuthenticatedRequest, res: Response) {
    const csv = await clientService.exportCsv(req.auth!.companyId);
    res.header("Content-Type", "text/csv").attachment("clienti.csv").send(csv);
  },
};
