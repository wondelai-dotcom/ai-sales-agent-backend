import rateLimit from "express-rate-limit";

const common = {
  standardHeaders: "draft-8" as const,
  legacyHeaders: false,
  // In-memory store is suitable for a single instance only. Configure a
  // shared store (Redis) before running multiple backend replicas.
};

export const apiRateLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 300,
  message: { error: { code: "TOO_MANY_REQUESTS", message: "Troppe richieste, riprova più tardi" } },
});

export const authRateLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { error: { code: "TOO_MANY_ATTEMPTS", message: "Troppi tentativi, riprova più tardi" } },
});

export const refreshRateLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { error: { code: "TOO_MANY_REFRESH_ATTEMPTS", message: "Troppe richieste di rinnovo, effettua nuovamente il login" } },
});
