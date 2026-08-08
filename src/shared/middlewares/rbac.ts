import { NextFunction, Response } from "express";
import { AppError } from "../errors/AppError";
import { AuthenticatedRequest } from "./auth";

// RBAC semplice basato sul nome del ruolo (Owner/Admin/Manager/Operatore).
// Per permessi piu' granulari, incrociare req.auth.roleId con la tabella
// Permission via Role.permissions (gia' modellata in schema.prisma).
export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      throw AppError.unauthorized();
    }
    if (!allowedRoles.includes(req.auth.roleName)) {
      throw AppError.forbidden(`Richiesto uno dei ruoli: ${allowedRoles.join(", ")}`);
    }
    next();
  };
}
