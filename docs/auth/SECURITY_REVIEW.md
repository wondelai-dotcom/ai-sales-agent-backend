# Authentication security review

Review scope: current authentication source and directly related middleware/configuration in this repository. This is a code/documentation review, not a penetration test or deployment audit.

## Existing controls observed

- Passwords are bcrypt-hashed with 12 salt rounds.
- Registration/login use a common invalid-credentials response for missing/inactive users and wrong passwords.
- Access and refresh JWTs use separate configured secrets.
- Access tokens default to 15 minutes; refresh tokens default to 30 days.
- Refresh-token and password-reset-token hashes, not raw values, are persisted.
- Refresh-token rotation replaces the stored hash; a mismatch clears the stored refresh hash.
- Password-reset request responds generically to reduce email enumeration.
- Reset tokens have a 30-minute expiry.
- Login, registration and password-reset routes use a stricter rate limiter.
- Protected routers use bearer-token authentication; a role middleware is available.
- User records are associated with a company and JWT claims include `companyId`.

## Gaps and recommended priority

### P0 — required before relying on password reset

**Reset token delivery is missing.** `auth.service.ts` persists the token hash but contains a TODO for sending the raw token. Implement a real email/notification provider, never log the raw token, and test the complete request-to-confirm journey.

### P1 — production hardening

1. **Rate-limit refresh.** Attach the auth limiter or a dedicated limiter to `POST /refresh`; consider per-IP and per-account controls.
2. **Define browser token storage.** The current API returns both tokens as JSON and does not set cookies. Document and implement the chosen browser strategy. Avoid long-lived refresh tokens in localStorage where possible.
3. **Review refresh-session model.** A single `refreshTokenHash` on `User` means one active refresh credential per user, not independent sessions per device. Move to a session/token-family model if multi-device use is expected.
4. **Clarify logout semantics.** Logout invalidates refresh but not already-issued access JWTs. Decide whether short access expiry is sufficient or whether a revocation/version mechanism is needed.
5. **Enforce tenant isolation everywhere.** Every query for company-owned resources must be scoped using the authenticated `req.auth.companyId`; test attempts to access another tenant's IDs.
6. **Review RBAC coverage.** `requireRole` exists, but each privileged route must explicitly apply it. Do not rely on UI hiding controls.
7. **Configure CORS deliberately.** `createApp` currently calls `cors()` without an explicit origin allowlist. Restrict origins to known frontend origins in production.
8. **Add security-focused tests.** Cover expired/wrong-signature tokens, refresh rotation/reuse, logout, reset expiry and one-time use, inactive users, rate limits, role boundaries and tenant isolation.

### P2 — security lifecycle

- Implement email verification before enabling `emailVerifiedAt` as an account state.
- Implement MFA only with a complete enrollment, recovery and enforcement design; it is not implemented now.
- Decide whether password reset should revoke all refresh sessions.
- Add audit events for security-sensitive actions without storing secrets or raw tokens.
- Define key rotation and incident response procedures for JWT secrets.
- Confirm HTTPS, database encryption/backups and secret management in the production environment.

## Scope limitations

This review does not establish that production secrets are strong, HTTPS is enabled, database backups work, CORS is overridden by an upstream proxy, or the deployed API matches this branch. Those require environment and deployment verification.
