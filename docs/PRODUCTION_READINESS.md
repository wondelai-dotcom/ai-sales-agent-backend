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

1. **Password reset delivery:** current service generates a reset token but has no email sender. Implement a provider, secure delivery, expiry/one-time-use tests and operational monitoring.
2. **Database migrations:** deployment currently needs a reviewed, versioned migration workflow. Do not use `prisma db push` as a production migration strategy. Verify whether migrations are committed and make deployment use `prisma migrate deploy`.
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
3. Apply reviewed migrations using the production migration mechanism.
4. Run integration, authorization and tenant-isolation tests against staging.
5. Verify password reset delivery, token rotation, logout and account recovery.
6. Test backups and a restore to a separate database.
7. Verify HTTPS, CORS, proxy behavior, rate limits and health probes.
8. Perform a smoke test with synthetic data.
9. Deploy with rollback available and monitor errors, latency and database health.
10. Enable real customers only after every blocker is closed.

## Important scope note

This document is a release gate, not a certification. The hardening changes have not been compiled or executed in the connected environment yet. CI must pass and staging verification must be completed before deployment.
