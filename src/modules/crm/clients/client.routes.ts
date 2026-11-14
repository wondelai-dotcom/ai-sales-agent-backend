import { Router } from "express";
import { requireAuth } from "../../../shared/middlewares/auth";
import { asyncHandler } from "../../../shared/middlewares/asyncHandler";
import { clientController } from "./client.controller";

export const clientRouter = Router();
clientRouter.use(requireAuth);
clientRouter.get("/", asyncHandler(clientController.list));
clientRouter.get("/export", asyncHandler(clientController.exportCsv));
clientRouter.get("/:id", asyncHandler(clientController.getById));
clientRouter.post("/", asyncHandler(clientController.create));
clientRouter.patch("/:id", asyncHandler(clientController.update));
clientRouter.delete("/:id", asyncHandler(clientController.remove));
