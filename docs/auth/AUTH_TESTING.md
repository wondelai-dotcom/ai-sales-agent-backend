# Authentication testing guide

The repository uses Vitest (`npm test` runs `vitest run`). This guide lists the behaviors that should be covered; it does not claim that every test below already exists.

## Unit tests: service

### Registration
- Reject an email already associated with a user.
- Reject registration if the OWNER role has not been seeded.
- Hash the password; never persist the submitted plaintext.
- Create company and owner user atomically.
- Return a valid access token and refresh token.
- Persist only the SHA-256 refresh-token hash.

### Login
- Reject an unknown email and a wrong password with the same public message.
- Reject inactive users.
- Accept a correct password.
- Issue a new token pair and replace the stored refresh hash.

### Refresh
- Reject malformed, expired and wrong-secret refresh JWTs.
- Reject a missing user or missing stored hash.
- Accept the current token and rotate it.
- Reject reuse of the previous token.
- Verify the mismatch path clears the stored refresh hash.
- Verify a second login replaces the previously stored refresh credential.

### Logout
- Clear the stored refresh hash.
- Verify the old refresh token cannot be used afterwards.
- Document and test that an already-issued access token remains valid until expiry under the current design.

### Password reset
- Return the same public response for existing and unknown email addresses.
- Store only a hash of the generated token.
- Set the expiry to 30 minutes.
- Reject invalid and expired tokens.
- Hash the new password and clear reset fields after success.
- Add an integration test for delivery once the email provider is implemented.

## Middleware tests

- Missing Authorization header is rejected.
- Non-Bearer Authorization header is rejected.
- Invalid signature and expired access JWT are rejected.
- Valid access JWT populates userId, companyId, roleId and roleName on `req.auth`.
- `requireRole` rejects unauthenticated requests and disallowed roles.
- `requireRole` permits each explicitly allowed role.

## Integration tests

- Public auth routes are reachable without an access token where intended.
- `/me` and logout require a valid access token.
- Auth rate limiter applies to register, login and reset routes.
- Add a regression test that refresh is rate-limited after the route is hardened.
- Tenant A cannot read, modify or delete Tenant B's clients, leads, appointments, quotes or conversations by guessing IDs.
- A user's disabled state prevents login.
- Password reset and password change have the intended session-revocation behavior.

## Manual local verification

1. Configure `DATABASE_URL`, `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` in a local, untracked `.env`.
2. Run migrations and `npx tsx prisma/seed.ts` so the OWNER role exists.
3. Start the API with `npm run dev`.
4. Register a test company and owner.
5. Call `GET /api/auth/me` using the returned access token.
6. Refresh using the returned refresh token; verify the old refresh token is rejected.
7. Logout and verify refresh is rejected.
8. Do not use production customer data or real secrets in local test runs.

Never commit `.env`, JWT secrets, real access/refresh tokens, reset tokens, customer data or test credentials.
