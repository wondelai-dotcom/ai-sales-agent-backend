# Authentication

This document describes the authentication implementation currently present in this repository. It is based on the source files listed in [Source map](#source-map); it is not a claim that every production-hardening feature is complete.

## Components

| Component | Responsibility |
|---|---|
| `src/modules/auth/auth.routes.ts` | Declares registration, login, refresh, logout, profile and password-reset routes. |
| `auth.controller.ts` | Parses request bodies with Zod and maps service results to HTTP responses. |
| `auth.validation.ts` | Defines input schemas. Registration and reset passwords require at least 8 characters. |
| `auth.service.ts` | Implements registration, password verification, token issuance/rotation, logout and reset logic. |
| `auth.repository.ts` | Encapsulates Prisma access for users, roles, companies and token hashes. |
| `src/shared/middlewares/auth.ts` | Verifies access JWTs from the Authorization header and attaches identity to `req.auth`. |
| `src/shared/middlewares/rbac.ts` | Provides role-name authorization through `requireRole(...)`. |
| `src/shared/utils/jwt.ts` | Signs and verifies access and refresh JWTs using separate secrets. |
| `src/shared/utils/password.ts` | Hashes passwords with bcryptjs and token values with SHA-256. |
| `src/config/env.ts` | Loads JWT secrets and expiry configuration from environment variables. |
| `prisma/schema.prisma` | Persists password hashes, refresh-token hashes and password-reset state. |

## Supported routes

All routes are mounted below `/api/auth`.

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/register` | Public; auth rate limit | Create a company and its OWNER user, then issue tokens. |
| POST | `/login` | Public; auth rate limit | Verify credentials and issue tokens. |
| POST | `/refresh` | Public; no route-specific auth limiter currently applied | Validate and rotate the refresh token. |
| POST | `/password-reset/request` | Public; auth rate limit | Generate and persist a password-reset token hash. |
| POST | `/password-reset/confirm` | Public; auth rate limit | Validate a reset token and update the password. |
| POST | `/logout` | Requires access JWT | Clear the user's stored refresh-token hash. |
| GET | `/me` | Requires access JWT | Return the authenticated user's basic profile. |

## Password handling

Passwords are never stored as plaintext by the auth service. `hashPassword` uses bcryptjs with 12 salt rounds; login uses `bcrypt.compare` through `verifyPassword`. The database field is `User.passwordHash`.

## Token model

Two JWT types are used:

- Access token: signed with `JWT_ACCESS_SECRET`; payload contains `sub` (user ID), `companyId`, `roleId` and `roleName`. Default expiry is 15 minutes.
- Refresh token: signed with `JWT_REFRESH_SECRET`; payload contains `sub` (user ID). Default expiry is 30 days.

The expiry values can be overridden with `JWT_ACCESS_EXPIRES_IN` and `JWT_REFRESH_EXPIRES_IN`. The raw refresh token is returned to the caller, while only its SHA-256 hash is stored in `User.refreshTokenHash`.

## Authorization and tenant identity

Protected route middleware expects `Authorization: Bearer <access-token>`. On successful verification it sets `req.auth` with the user, company and role identifiers. The `requireRole` middleware can reject requests whose role name is not in the allowed list. Controllers/services must still scope resource access to the authenticated `companyId`; possession of a valid JWT alone is not a substitute for tenant-scoped database queries.

## Important implementation limitations

1. Password-reset delivery is not implemented: the service creates a random token and stores its hash, but the notification/email TODO is still present. A user cannot complete the normal email reset journey until delivery is implemented.
2. Email verification is not implemented. Registration contains a TODO; `emailVerifiedAt` exists in the schema but is not enforced by login.
3. MFA is not implemented.
4. A single `refreshTokenHash` field exists per user. Issuing a new refresh token replaces the previous one, so this is not a multi-device/session store.
5. Logout clears the refresh-token hash. Already-issued access JWTs remain cryptographically valid until expiry unless another revocation mechanism is added.
6. Refresh requests do not currently receive the stricter auth-specific rate limiter in `auth.routes.ts`.

## Source map

- `src/modules/auth/auth.routes.ts`
- `src/modules/auth/auth.controller.ts`
- `src/modules/auth/auth.service.ts`
- `src/modules/auth/auth.repository.ts`
- `src/modules/auth/auth.validation.ts`
- `src/shared/middlewares/auth.ts`
- `src/shared/middlewares/rbac.ts`
- `src/shared/utils/jwt.ts`
- `src/shared/utils/password.ts`
- `src/config/env.ts`
- `prisma/schema.prisma`
