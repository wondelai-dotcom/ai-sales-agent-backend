import { Router } from "express";
import { requireAuth } from "../../../shared/middlewares/auth";
import { asyncHandler } from "../../../shared/middlewares/asyncHandler";
import { leadController } from "./lead.controller";

export const leadRouter = Router();
leadRouter.use(requireAuth);
leadRouter.get("/", asyncHandler(leadController.list));
leadRouter.get("/pipeline-summary", asyncHandler(leadController.pipelineSummary));
leadRouter.post("/", asyncHandler(leadController.create));
leadRouter.patch("/:id/stage", asyncHandler(leadController.updateStage));
