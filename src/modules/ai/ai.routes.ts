import { Router } from "express";
import { requireAuth } from "../../shared/middlewares/auth";
import { asyncHandler } from "../../shared/middlewares/asyncHandler";
import { aiController } from "./ai.controller";

export const aiRouter = Router();
aiRouter.use(requireAuth);
aiRouter.post("/message", asyncHandler(aiController.handleMessage));
aiRouter.get("/conversations", asyncHandler(aiController.listConversations));
aiRouter.get("/conversations/:id", asyncHandler(aiController.getConversation));
aiRouter.post("/conversations/:id/messages", asyncHandler(aiController.sendOperatorMessage));
