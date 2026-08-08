import { Router } from "express";
import { requireAuth } from "../../shared/middlewares/auth";
import { quoteController } from "./quote.controller";

export const quoteRouter = Router();

quoteRouter.use(requireAuth);
quoteRouter.get("/", quoteController.list);
quoteRouter.get("/:id/pdf", quoteController.pdf);
quoteRouter.post("/:id/payment-link", quoteController.paymentLink);
quoteRouter.post("/", quoteController.create);
quoteRouter.patch("/:id/status", quoteController.updateStatus);
