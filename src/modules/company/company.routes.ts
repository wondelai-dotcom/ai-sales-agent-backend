import { Router } from "express";
import { requireAuth } from "../../shared/middlewares/auth";
import { requireRole } from "../../shared/middlewares/rbac";
import { asyncHandler } from "../../shared/middlewares/asyncHandler";
import { companyController } from "./company.controller";

export const companyRouter = Router();
companyRouter.use(requireAuth);
companyRouter.get("/", asyncHandler(companyController.get));
companyRouter.patch("/", requireRole("OWNER", "ADMIN"), asyncHandler(companyController.update));
companyRouter.get("/services", asyncHandler(companyController.listServices));
companyRouter.post("/services", requireRole("OWNER", "ADMIN"), asyncHandler(companyController.createService));
companyRouter.patch("/services/:id", requireRole("OWNER", "ADMIN"), asyncHandler(companyController.updateService));
companyRouter.delete("/services/:id", requireRole("OWNER", "ADMIN"), asyncHandler(companyController.deleteService));
