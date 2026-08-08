import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { verifyAccessToken } from "../utils/jwt";

export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    companyId: string;
    roleId: string;
    roleName: string;
  };
}

// Estrae e valida il JWT dall'header Authorization.
// Popola req.auth con { userId, companyId, roleId, roleName }: da qui in poi
// ogni query nei moduli DEVE filtrare per companyId (isolamento multi-tenant).
export function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw AppError.unauthorized("Token di accesso mancante");
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = verifyAccessToken(token);
    req.auth = {
      userId: payload.sub,
      companyId: payload.companyId,
      roleId: payload.roleId,
      roleName: payload.roleName,
    };
    next();
  } catch {
    throw AppError.unauthorized("Token di accesso non valido o scaduto");
  }
}
