import { Router } from "express";
import { requireAuth } from "../../shared/middlewares/auth";
import { authRateLimiter, refreshRateLimiter } from "../../shared/middlewares/rateLimit";
import { asyncHandler } from "../../shared/middlewares/asyncHandler";
import { authController } from "./auth.controller";

export const authRouter = Router();

authRouter.post("/register", authRateLimiter, asyncHandler(authController.register));
authRouter.post("/login", authRateLimiter, asyncHandler(authController.login));
authRouter.post("/refresh", refreshRateLimiter, asyncHandler(authController.refresh));
authRouter.post("/resend-verification", authRateLimiter, asyncHandler(authController.resendEmailVerification));
authRouter.post("/verify-email", authRateLimiter, asyncHandler(authController.verifyEmail));
authRouter.post("/password-reset/request", authRateLimiter, asyncHandler(authController.requestPasswordReset));
authRouter.post("/password-reset/confirm", authRateLimiter, asyncHandler(authController.confirmPasswordReset));
authRouter.post("/logout", requireAuth, asyncHandler(authController.logout));
authRouter.get("/me", requireAuth, asyncHandler(authController.me));
