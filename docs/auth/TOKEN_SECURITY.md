# Credential and token security

## Secrets

The application reads these required variables at startup:

- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

Use two different, high-entropy secret values. Do not commit them to Git, put them in frontend bundles, or share them in issue reports. Configure them in the deployment platform's secret/environment-variable manager. The source defaults access-token expiry to `15m` and refresh-token expiry to `30d`; both are configurable.

The configuration also requires `DATABASE_URL`. The database connection string is a secret and must be managed the same way.

## Passwords

- Hashing: bcryptjs, 12 salt rounds.
- Verification: bcrypt comparison; the plaintext password is not persisted by the auth service.
- Minimum length enforced by the current Zod schemas: 8 characters for registration and password reset.
- Do not log request bodies containing passwords.

## Refresh and reset tokens

- Refresh tokens and password-reset tokens are stored as SHA-256 hashes, not raw token strings.
- Refresh token raw value is returned once to the client by registration/login/refresh.
- Password-reset token raw value is generated but currently not delivered because the email integration is a TODO.
- Reset token expiry is 30 minutes.
- Refresh token expiry defaults to 30 days.

SHA-256 is appropriate here because these tokens are generated with cryptographically secure randomness (`crypto.randomBytes(32)`); it is not the password hashing mechanism.

## Client handling recommendations

The backend currently returns tokens in JSON and accepts refresh tokens in the JSON body. It does not set cookies. The repository does not prescribe or implement a browser token-storage strategy.

For a browser application, prefer a backend-for-frontend or secure, HttpOnly, Secure, SameSite cookie-based refresh session rather than persisting long-lived refresh tokens in localStorage. If the existing JSON contract is retained, keep tokens out of URLs, logs, analytics, crash reports and browser console output; use HTTPS only; minimize refresh-token exposure; and implement a deliberate XSS/CSRF threat model.

## Revocation semantics

- Refresh rotation is backed by one hash field per user.
- A newly issued refresh token overwrites the previously stored hash.
- Logout clears the stored hash.
- A refresh-token mismatch clears the current stored hash and rejects the request.
- Access tokens are stateless and are not checked against a revocation list. They remain usable until expiry.

Because there is one refresh hash per user, multiple concurrent devices/sessions are not independently represented. Consider a dedicated session table with token-family identifiers, device metadata, creation/last-used timestamps, revocation timestamps and per-session hashes before supporting multiple devices.

## Production checklist

- [ ] Generate independent, high-entropy access and refresh secrets.
- [ ] Set secrets only in the hosting provider's secret manager.
- [ ] Enforce HTTPS end-to-end.
- [ ] Add a strict origin allowlist for CORS appropriate to the deployed frontend.
- [ ] Apply rate limiting to refresh as well as login, registration and reset endpoints.
- [ ] Implement reset-token delivery and verify the end-to-end reset flow.
- [ ] Decide whether to revoke all sessions on password change/reset.
- [ ] Decide how immediate access-token revocation should work, if required.
- [ ] Add per-session refresh-token storage if multiple devices are supported.
- [ ] Ensure access tokens and credentials are redacted from logs and monitoring.
- [ ] Review cookie, CSRF and XSS protections if browser cookies are introduced.
- [ ] Add automated tests for rotation, reuse, logout, expiry and cross-tenant access.
