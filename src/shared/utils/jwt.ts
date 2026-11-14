import jwt from "jsonwebtoken";
import { env } from "../../config/env";

export interface AccessTokenPayload {
  sub: string;
  companyId: string;
  roleId: string;
  roleName: string;
  tokenVersion: number;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.jwt.accessSecret, {
    algorithm: "HS256",
    expiresIn: env.jwt.accessExpiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.jwt.refreshSecret, {
    algorithm: "HS256",
    expiresIn: env.jwt.refreshExpiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwt.accessSecret, { algorithms: ["HS256"] }) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, env.jwt.refreshSecret, { algorithms: ["HS256"] }) as { sub: string };
}
