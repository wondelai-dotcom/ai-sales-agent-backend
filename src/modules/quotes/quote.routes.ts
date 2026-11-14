import { Router } from "express";
import { requireAuth } from "../../shared/middlewares/auth";
import { asyncHandler } from "../../shared/middlewares/asyncHandler";
import { quoteController } from "./quote.controller";

export const quoteRouter = Router();
quoteRouter.use(requireAuth);
quoteRouter.get("/", asyncHandler(quoteController.list));
quoteRouter.get("/:id/pdf", asyncHandler(quoteController.pdf));
quoteRouter.post("/:id/payment-link", asyncHandler(quoteController.paymentLink));
quoteRouter.post("/", asyncHandler(quoteController.create));
quoteRouter.patch("/:id/status", asyncHandler(quoteController.updateStatus));
