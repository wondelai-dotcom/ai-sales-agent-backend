import { Router } from "express";
import { requireAuth } from "../../../shared/middlewares/auth";
import { leadController } from "./lead.controller";

export const leadRouter = Router();

leadRouter.use(requireAuth);
leadRouter.get("/", leadController.list);
leadRouter.get("/pipeline-summary", leadController.pipelineSummary);
leadRouter.post("/", leadController.create);
leadRouter.patch("/:id/stage", leadController.updateStage);
