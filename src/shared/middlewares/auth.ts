import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { prisma } from "../db/prisma";
import { verifyAccessToken } from "../utils/jwt";

export interface AuthenticatedRequest extends Request {
  auth?: { userId: string; companyId: string; roleId: string; roleName: string };
}

/**
 * Verify the JWT and reload the user's active membership from PostgreSQL.
 * This prevents disabled users and stale role/company claims from retaining
 * API access until the JWT expires. It deliberately adds one indexed lookup
 * per authenticated request; monitor database capacity under production load.
 */
export function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(AppError.unauthorized("Token di accesso mancante"));
  }
  const token = header.slice("Bearer ".length).trim();
  if (!token || token.length > 8192) {
    return next(AppError.unauthorized("Token di accesso non valido"));
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
    if (!payload.sub || !payload.companyId) {
      return next(AppError.unauthorized("Token di accesso non valido"));
    }
  } catch {
    return next(AppError.unauthorized("Token di accesso non valido o scaduto"));
  }

  void prisma.user.findUnique({
    where: { id: payload.sub },
    include: { role: true },
  }).then((user) => {
    if (!user || !user.isActive || user.companyId !== payload.companyId) {
      return next(AppError.unauthorized("Account non attivo o sessione non valida"));
    }
    req.auth = {
      userId: user.id,
      companyId: user.companyId,
      roleId: user.roleId,
      roleName: user.role.name,
    };
    return next();
  }).catch(next);
}
