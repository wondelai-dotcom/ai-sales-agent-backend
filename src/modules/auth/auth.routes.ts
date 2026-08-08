import { Router } from "express";
import { requireAuth } from "../../shared/middlewares/auth";
import { authRateLimiter } from "../../shared/middlewares/rateLimit";
import { authController } from "./auth.controller";

export const authRouter = Router();

authRouter.post("/register", authRateLimiter, authController.register);
authRouter.post("/login", authRateLimiter, authController.login);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/password-reset/request", authRateLimiter, authController.requestPasswordReset);
authRouter.post("/password-reset/confirm", authRateLimiter, authController.confirmPasswordReset);
authRouter.post("/logout", requireAuth, authController.logout);
authRouter.get("/me", requireAuth, authController.me);
