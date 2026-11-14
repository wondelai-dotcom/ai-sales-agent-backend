# Authentication request flows

The following flows describe the current source implementation.

## Registration

1. Client sends `POST /api/auth/register` with `ragioneSociale`, `email`, `password`, `nome` and `cognome`.
2. The auth rate limiter runs; the controller validates the body with `registerSchema`.
3. The service checks whether a user already exists for the email.
4. It loads the seeded `OWNER` role. Registration fails with a server error if the role seed has not been run.
5. The password is bcrypt-hashed (12 rounds).
6. The repository creates the company and owner user inside one Prisma transaction.
7. The service signs an access token and refresh token and stores the SHA-256 hash of the refresh token on the user record.
8. The controller returns both tokens with HTTP 201.

Email verification is not part of this flow yet; the service contains a TODO for sending a verification email.

## Login

1. Client sends `POST /api/auth/login` with email and password.
2. Auth rate limiter runs and Zod validates the request.
3. The service looks up the user and rejects missing or inactive users.
4. bcrypt compares the submitted password with `User.passwordHash`.
5. On success, the service issues a new access/refresh pair and replaces `User.refreshTokenHash`.
6. The controller returns the pair with HTTP 200.

The error message for an unknown email and a wrong password is the same ("Credenziali non valide").

## Authenticated API request

1. Client sends `Authorization: Bearer <accessToken>`.
2. A protected router runs `requireAuth`.
3. The middleware verifies the JWT using the access secret.
4. It maps `sub`, `companyId`, `roleId` and `roleName` into `req.auth`.
5. The controller/service uses the authenticated identity. Tenant-owned data must be queried using the authenticated `companyId`.
6. If a route also uses `requireRole(...)`, the middleware checks the role name before continuing.

Missing or invalid access tokens produce an unauthorized error. The access token is stateless; the middleware does not query the database on every request.

## Refresh and rotation

1. Client sends `POST /api/auth/refresh` with JSON body `{ "refreshToken": "..." }`.
2. The service verifies the JWT with the separate refresh secret.
3. It loads the user by the JWT subject and requires a stored refresh-token hash.
4. It hashes the presented token with SHA-256 and compares it with the stored hash.
5. If the hash does not match, the service clears the stored hash and rejects the request. This is intended to respond to possible reuse of an already-rotated token.
6. If it matches, the service issues a new pair and replaces the stored refresh-token hash.

The refresh endpoint is currently not protected by `requireAuth` and does not have the stricter `authRateLimiter` attached in the route declaration.

## Logout

1. Client sends `POST /api/auth/logout` with a valid access JWT.
2. `requireAuth` verifies it and attaches `req.auth`.
3. The service sets that user's `refreshTokenHash` to null.
4. The endpoint returns HTTP 204.

This revokes the stored refresh credential, not the already-issued access JWT. The access JWT can continue to work until its expiry.

## Password reset

1. Client sends `POST /api/auth/password-reset/request` with an email.
2. The service looks up the user. It returns the same success response whether or not the email exists, reducing account-enumeration risk.
3. For an existing user, it generates 32 random bytes, stores only the SHA-256 hash and sets a 30-minute expiry.
4. The intended raw token email delivery is a TODO and is not implemented.
5. The confirmation endpoint accepts a raw token and a new password, finds a matching unexpired hash, hashes the new password and clears reset-token fields.

**Operational consequence:** until an email/notification sender is implemented, the standard reset flow cannot deliver the token to the account owner.

## Error handling

The application registers a central error handler after the routers. Known `AppError` instances are converted to a JSON error envelope; unexpected errors are logged server-side and return a generic 500 response.
