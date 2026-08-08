import { Response } from "express";
import { AuthenticatedRequest } from "../../shared/middlewares/auth";
import { appointmentService } from "./appointment.service";
import { createAppointmentSchema, listAppointmentsQuerySchema, updateAppointmentStatusSchema } from "./appointment.validation";

export const appointmentController = {
  async list(req: AuthenticatedRequest, res: Response) {
    const { from, to } = listAppointmentsQuerySchema.parse(req.query);
    res.json(await appointmentService.list(req.auth!.companyId, from, to));
  },

  async create(req: AuthenticatedRequest, res: Response) {
    const input = createAppointmentSchema.parse(req.body);
    const appointment = await appointmentService.create(req.auth!.companyId, input);
    res.status(201).json(appointment);
  },

  async updateStatus(req: AuthenticatedRequest, res: Response) {
    const { stato } = updateAppointmentStatusSchema.parse(req.body);
    await appointmentService.updateStatus(req.auth!.companyId, req.params.id, stato);
    res.json({ message: "Stato aggiornato" });
  },
};
