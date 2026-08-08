import { Router } from "express";
import { requireAuth } from "../../shared/middlewares/auth";
import { appointmentController } from "./appointment.controller";

export const appointmentRouter = Router();

appointmentRouter.use(requireAuth);
appointmentRouter.get("/", appointmentController.list);
appointmentRouter.post("/", appointmentController.create);
appointmentRouter.patch("/:id/status", appointmentController.updateStatus);
