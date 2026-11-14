import { Router } from "express";
import { requireAuth } from "../../shared/middlewares/auth";
import { asyncHandler } from "../../shared/middlewares/asyncHandler";
import { appointmentController } from "./appointment.controller";

export const appointmentRouter = Router();
appointmentRouter.use(requireAuth);
appointmentRouter.get("/", asyncHandler(appointmentController.list));
appointmentRouter.post("/", asyncHandler(appointmentController.create));
appointmentRouter.patch("/:id/status", asyncHandler(appointmentController.updateStatus));
