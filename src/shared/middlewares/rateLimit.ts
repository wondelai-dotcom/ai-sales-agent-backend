import rateLimit from "express-rate-limit";

// Rate limit generale sulle API pubbliche.
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit piu' stringente su login/registrazione per mitigare brute force.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "TOO_MANY_ATTEMPTS", message: "Troppi tentativi, riprova piu' tardi" } },
});
