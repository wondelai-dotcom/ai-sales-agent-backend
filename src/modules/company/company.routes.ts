import { Router } from "express";
import { requireAuth } from "../../shared/middlewares/auth";
import { companyController } from "./company.controller";

export const companyRouter = Router();

companyRouter.use(requireAuth);
companyRouter.get("/", companyController.get);
companyRouter.patch("/", companyController.update);
companyRouter.get("/services", companyController.listServices);
companyRouter.post("/services", companyController.createService);
companyRouter.patch("/services/:id", companyController.updateService);
companyRouter.delete("/services/:id", companyController.deleteService);
