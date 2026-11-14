import { Router } from "express";
import { requireAuth } from "../../shared/middlewares/auth";
import { asyncHandler } from "../../shared/middlewares/asyncHandler";
import { companyController } from "./company.controller";

export const companyRouter = Router();
companyRouter.use(requireAuth);
companyRouter.get("/", asyncHandler(companyController.get));
companyRouter.patch("/", asyncHandler(companyController.update));
companyRouter.get("/services", asyncHandler(companyController.listServices));
companyRouter.post("/services", asyncHandler(companyController.createService));
companyRouter.patch("/services/:id", asyncHandler(companyController.updateService));
companyRouter.delete("/services/:id", asyncHandler(companyController.deleteService));
