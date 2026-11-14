# Authentication API reference

Base path: `/api/auth`

All request bodies are JSON. The API currently returns tokens in JSON responses; it does not set authentication cookies.

## Register

`POST /api/auth/register`

Request:

```json
{
  "ragioneSociale": "Acme Srl",
  "email": "owner@example.com",
  "password": "at-least-8-characters",
  "nome": "Ada",
  "cognome": "Rossi"
}
```

Success: HTTP 201 with `accessToken` and `refreshToken`.

## Login

`POST /api/auth/login`

Request:

```json
{
  "email": "owner@example.com",
  "password": "your-password"
}
```

Success: HTTP 200 with `accessToken` and `refreshToken`.

## Refresh

`POST /api/auth/refresh`

Request:

```json
{
  "refreshToken": "<refresh-token>"
}
```

Success: HTTP 200 with a newly issued access/refresh pair. The previous refresh token is no longer accepted after successful rotation.

## Current user

`GET /api/auth/me`

Header:

```http
Authorization: Bearer <access-token>
```

Success: HTTP 200 with `id`, `email`, `nome`, `cognome`, `companyId` and `ruolo`.

## Logout

`POST /api/auth/logout`

Header:

```http
Authorization: Bearer <access-token>
```

Success: HTTP 204, no response body. The stored refresh-token hash is cleared. The current access JWT is not immediately revoked.

## Request password reset

`POST /api/auth/password-reset/request`

Request:

```json
{ "email": "owner@example.com" }
```

Success: HTTP 200 with a generic message that does not reveal whether the email exists. For existing users, a 30-minute reset-token hash is stored. Email delivery is not implemented yet.

## Confirm password reset

`POST /api/auth/password-reset/confirm`

Request:

```json
{
  "token": "<reset-token-delivered-out-of-band>",
  "newPassword": "at-least-8-characters"
}
```

Success: HTTP 200 with a confirmation message. Invalid or expired tokens return an unauthorized error.

## Rate limits

The application-wide limiter is configured for 300 requests per 15 minutes. The stricter auth limiter is configured for 20 requests per 15 minutes and is attached to registration, login and both password-reset routes. The refresh route currently does not use the stricter limiter.

## Error shape

Known application errors use:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Human-readable message",
    "details": null
  }
}
```

Exact status and error code depend on the failure. Unexpected errors return a generic HTTP 500 response.
