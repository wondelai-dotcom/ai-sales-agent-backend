import { Router } from "express";
import { requireAuth } from "../../shared/middlewares/auth";
import { requireRole } from "../../shared/middlewares/rbac";
import { asyncHandler } from "../../shared/middlewares/asyncHandler";
import { automationsController } from "./automations.controller";

export const automationsRouter = Router();
automationsRouter.use(requireAuth, requireRole("OWNER", "ADMIN"));
automationsRouter.post("/missed-call", asyncHandler(automationsController.missedCall));
automationsRouter.post("/run-reminders", asyncHandler(automationsController.runReminders));
automationsRouter.post("/run-review-requests", asyncHandler(automationsController.runReviewRequests));
automationsRouter.get("/maintenance-due", asyncHandler(automationsController.checkMaintenance));
