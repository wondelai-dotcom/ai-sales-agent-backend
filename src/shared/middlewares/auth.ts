import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { verifyAccessToken } from "../utils/jwt";

export interface AuthenticatedRequest extends Request {
  auth?: { userId: string; companyId: string; roleId: string; roleName: string };
}

export function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(AppError.unauthorized("Token di accesso mancante"));
  }
  const token = header.slice("Bearer ".length).trim();
  if (!token || token.length > 8192) {
    return next(AppError.unauthorized("Token di accesso non valido"));
  }
  try {
    const payload = verifyAccessToken(token);
    if (!payload.sub || !payload.companyId || !payload.roleId || !payload.roleName) {
      return next(AppError.unauthorized("Token di accesso non valido"));
    }
    req.auth = {
      userId: payload.sub,
      companyId: payload.companyId,
      roleId: payload.roleId,
      roleName: payload.roleName,
    };
    return next();
  } catch {
    return next(AppError.unauthorized("Token di accesso non valido o scaduto"));
  }
}
