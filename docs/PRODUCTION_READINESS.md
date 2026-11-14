# Production readiness gate

This repository is not considered production-ready merely because it builds. Release requires the evidence below.

## Changes in the hardening branch

- Express 4 async controllers are wrapped so rejected promises reach the centralized error handler.
- CORS is restricted to explicit origins in production; production startup fails without `CORS_ORIGINS`.
- Production JWT secrets must be distinct and at least 32 characters.
- Request body sizes are limited to 1 MB; `x-powered-by` is disabled; Helmet remains enabled.
- Added liveness and database readiness endpoints.
- Added a dedicated refresh endpoint rate limiter.
- Refresh-token rotation now uses a conditional database update to prevent concurrent replay of the same refresh token.
- Password reset clears the stored refresh-token hash, requiring re-authentication.
- Added graceful shutdown and Prisma disconnect.
- Added a CI workflow for Prisma generation, TypeScript build and available tests.

## Blocking items — do not launch with real customer data until closed

1. **Email provider verification:** Resend delivery is implemented, but configure and verify the sender domain, secrets, templates/links and delivery events in staging. Confirm account verification and password reset end-to-end.
2. **Database migrations — confirmed blocker:** there is currently no `prisma/migrations/` directory in the repository. The production Docker startup no longer runs `prisma db push`; this avoids silently mutating a live schema, but it also means a database cannot be provisioned by this image alone. Create and review a baseline migration, commit it, and deploy it with `prisma migrate deploy` before enabling the service. Do not use `prisma db push` as a production migration strategy.
3. **Automated tests:** add meaningful unit/integration tests, especially auth, authorization, tenant isolation and core CRUD. A successful TypeScript build is not a substitute.
4. **CORS/browser authentication contract:** choose and verify token storage, XSS/CSRF protections, and exact production origins with the actual frontend.
5. **Rate limiting at scale:** express-rate-limit's default in-memory store is per-process. Use a shared Redis-backed store before horizontal scaling.
6. **Tenant isolation audit:** audit every repository query and nested relation mutation for companyId scoping. Test cross-company access for all resource types.
7. **RBAC:** confirm privileged operations are guarded by explicit role/permission checks. A role middleware existing in the codebase does not prove route coverage.
8. **Operational security:** configure HTTPS, managed secrets, database backups and restore drills, log retention/redaction, monitoring, alerting and incident response.
9. **External services:** verify OpenAI, Stripe, WhatsApp/Meta and notification provider credentials, webhooks, signatures and failure behavior before enabling their routes/features.
10. **Legal/privacy:** validate privacy notice, terms, data-processing agreements, retention/deletion procedures and GDPR obligations with qualified counsel.

## Deployment environment

Required:
- `NODE_ENV=production`
- `PORT` supplied by host (optional if default 4000 is accepted)
- `DATABASE_URL` pointing to managed PostgreSQL over TLS where supported
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`, distinct random values of at least 32 characters
- `CORS_ORIGINS` as a comma-separated exact allowlist of HTTPS frontend origins
- `TRUST_PROXY` set to the actual trusted proxy hop count only when applicable

Optional integrations must remain disabled until their credentials and webhook validation are configured.

## Health probes

- `GET /health/live`: process liveness only.
- `GET /health/ready`: checks database connectivity; returns 503 when unavailable.

## Release procedure

1. Review the complete diff and CI result.
2. Provision a staging database and production-like environment variables.
3. Generate and review the initial Prisma migration; commit the migration files and verify a clean database can be provisioned from scratch.
4. Apply reviewed migrations using `prisma migrate deploy` and run `npx prisma db seed` (or the documented seed command) to create the required OWNER/ADMIN/MANAGER/OPERATOR roles.
5. Run integration, authorization and tenant-isolation tests against staging.
6. Verify password reset delivery, token rotation, logout and account recovery.
7. Test backups and a restore to a separate database.
8. Verify HTTPS, CORS, proxy behavior, rate limits and health probes.
9. Perform a smoke test with synthetic data.
10. Deploy with rollback available and monitor errors, latency and database health.
11. Enable real customers only after every blocker is closed.

## Important scope note

This document is a release gate, not a certification. The hardening changes have not been compiled or executed in the connected environment yet. CI must pass and staging verification must be completed before deployment.
