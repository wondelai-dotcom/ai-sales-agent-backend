# Render deployment runbook

## Topology

- Render Web Service, Node runtime, Frankfurt region.
- Managed Render PostgreSQL, same region and private network.
- HTTPS is terminated by Render; the application trusts exactly one proxy hop.
- Render HTTP readiness probe: `GET /health/ready`.

## Important release gate

This service must not receive customer traffic until a reviewed Prisma migration exists in `prisma/migrations/`. The pre-deploy command runs `npx prisma migrate deploy`; it intentionally fails closed when migrations are missing or invalid. Never replace it with `prisma db push` in production.

## Provisioning

1. Connect the GitHub repository `wondelai-dotcom/ai-sales-agent-backend` to Render.
2. Create a Blueprint from `render.yaml` on branch `release/production-hardening`.
3. Create a managed PostgreSQL database in Frankfurt, preferably on a paid plan with automated backups. Keep it private to Render services where possible.
4. Copy the database connection URL into the web service's `DATABASE_URL` secret. Ensure it uses TLS and includes `sslmode=require`, as required by application startup validation.
5. Set `CORS_ORIGINS` to the exact HTTPS origin(s) of the deployed frontend. Do not use wildcards.
6. Set `APP_BASE_URL` to the frontend's HTTPS base URL.
7. Set `RESEND_API_KEY` and `EMAIL_FROM` only after verifying the sender domain with Resend.
8. Set `OPENAI_API_KEY` only when the AI feature is enabled and the provider has been tested in staging.
9. Confirm the two generated JWT secrets are distinct and retained by Render. Do not copy them into GitHub or local files.
10. Verify the first deployment and readiness probe before allowing external traffic.

## Build and runtime

- Build: `npm install && npx prisma generate && npm run build`
- Pre-deploy: `npx prisma migrate deploy`
- Start: `npm start`
- Health: `/health/ready`

The web service plan in the Blueprint is the smallest paid always-on plan. The database is provisioned separately so its storage, backups, and compute can be selected deliberately. Check current Render pricing before provisioning.

## Staging before production

Create a separate Render staging service and a separate PostgreSQL database. Never point staging at the production database. Use separate JWT secrets, Resend test configuration, and frontend origin. Run the complete CI suite and synthetic signup/login/refresh/logout/password-reset/tenant-isolation tests against staging.

## Operational checklist

- [ ] CI green on the exact release commit.
- [ ] Reviewed migration committed and successfully applied to an empty staging database.
- [ ] Existing production database (if any) separately assessed and baselined; do not apply an empty-database baseline blindly.
- [ ] Render service and PostgreSQL in Frankfurt.
- [ ] TLS database URL with `sslmode=require`.
- [ ] Exact HTTPS CORS origins and frontend URL configured.
- [ ] Resend sender verified; verification and reset emails tested end-to-end.
- [ ] Backups enabled and a restore drill completed.
- [ ] Monitoring, alerting, log redaction and rollback procedure documented.
- [ ] External integrations tested or disabled.
- [ ] Legal/privacy documents and GDPR processes reviewed.
- [ ] Final smoke test with synthetic data passed.

## Cost note

The Blueprint selects a paid web-service plan to avoid free-tier sleeping and cold starts. PostgreSQL is not automatically provisioned by this file; select an appropriate paid database plan and backup policy in Render before production use. Prices and plan identifiers can change; verify them in Render before confirming spend.
