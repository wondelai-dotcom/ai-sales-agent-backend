import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../shared/middlewares/auth";
import { authService } from "./auth.service";
import {
  confirmPasswordResetSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  requestPasswordResetSchema,
} from "./auth.validation";

export const authController = {
  async register(req: Request, res: Response) {
    const input = registerSchema.parse(req.body);
    const tokens = await authService.register(input);
    res.status(201).json(tokens);
  },

  async login(req: Request, res: Response) {
    const input = loginSchema.parse(req.body);
    const tokens = await authService.login(input);
    res.status(200).json(tokens);
  },

  async refresh(req: Request, res: Response) {
    const { refreshToken } = refreshSchema.parse(req.body);
    const tokens = await authService.refresh(refreshToken);
    res.status(200).json(tokens);
  },

  async logout(req: AuthenticatedRequest, res: Response) {
    await authService.logout(req.auth!.userId);
    res.status(204).send();
  },

  async me(req: AuthenticatedRequest, res: Response) {
    res.json(await authService.me(req.auth!.userId));
  },

  async requestPasswordReset(req: Request, res: Response) {
    const { email } = requestPasswordResetSchema.parse(req.body);
    await authService.requestPasswordReset(email);
    res.status(200).json({ message: "Se l'email esiste, riceverai le istruzioni per il reset" });
  },

  async confirmPasswordReset(req: Request, res: Response) {
    const { token, newPassword } = confirmPasswordResetSchema.parse(req.body);
    await authService.confirmPasswordReset(token, newPassword);
    res.status(200).json({ message: "Password aggiornata con successo" });
  },
};
