import { Response } from "express";
import { AuthenticatedRequest } from "../../shared/middlewares/auth";
import { companyService } from "./company.service";
import { createServiceSchema, updateCompanySchema, updateServiceSchema } from "./company.validation";

export const companyController = {
  async get(req: AuthenticatedRequest, res: Response) {
    res.json(await companyService.get(req.auth!.companyId));
  },

  async update(req: AuthenticatedRequest, res: Response) {
    const input = updateCompanySchema.parse(req.body);
    res.json(await companyService.update(req.auth!.companyId, input));
  },

  async listServices(req: AuthenticatedRequest, res: Response) {
    res.json(await companyService.listServices(req.auth!.companyId));
  },

  async createService(req: AuthenticatedRequest, res: Response) {
    const input = createServiceSchema.parse(req.body);
    res.status(201).json(await companyService.createService(req.auth!.companyId, input));
  },

  async updateService(req: AuthenticatedRequest, res: Response) {
    const input = updateServiceSchema.parse(req.body);
    await companyService.updateService(req.auth!.companyId, req.params.id, input);
    res.json({ message: "Servizio aggiornato" });
  },

  async deleteService(req: AuthenticatedRequest, res: Response) {
    await companyService.deleteService(req.auth!.companyId, req.params.id);
    res.status(204).send();
  },
};
