import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value.trim() === "") {
    throw new Error(`Variabile d'ambiente obbligatoria mancante: ${name}`);
  }
  return value;
}

function optional(name: string, fallback = ""): string {
  return process.env[name]?.trim() ?? fallback;
}

function positiveInteger(name: string, value: string, fallback: number): number {
  const parsed = value ? Number(value) : fallback;
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`La variabile ${name} deve essere un intero positivo`);
  }
  return parsed;
}

const nodeEnv = optional("NODE_ENV", "development");
const accessSecret = required("JWT_ACCESS_SECRET");
const refreshSecret = required("JWT_REFRESH_SECRET");

if (nodeEnv === "production") {
  if (accessSecret.length < 32 || refreshSecret.length < 32) {
    throw new Error("In produzione i segreti JWT devono avere almeno 32 caratteri casuali");
  }
  if (accessSecret === refreshSecret) {
    throw new Error("JWT_ACCESS_SECRET e JWT_REFRESH_SECRET devono essere distinti");
  }
}

const allowedOrigins = optional("CORS_ORIGINS")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (nodeEnv === "production" && allowedOrigins.length === 0) {
  throw new Error("CORS_ORIGINS è obbligatoria in produzione (lista separata da virgole)");
}

export const env = {
  nodeEnv,
  port: positiveInteger("PORT", optional("PORT"), 4000),
  trustProxy: positiveInteger("TRUST_PROXY", optional("TRUST_PROXY"), 0),
  databaseUrl: required("DATABASE_URL"),
  corsOrigins: allowedOrigins,
  jwt: {
    accessSecret,
    refreshSecret,
    accessExpiresIn: optional("JWT_ACCESS_EXPIRES_IN", "15m"),
    refreshExpiresIn: optional("JWT_REFRESH_EXPIRES_IN", "30d"),
  },
  integrations: {
    openaiApiKey: optional("OPENAI_API_KEY"),
    stripeSecretKey: optional("STRIPE_SECRET_KEY"),
    stripeWebhookSecret: optional("STRIPE_WEBHOOK_SECRET"),
    firebaseProjectId: optional("FIREBASE_PROJECT_ID"),
    whatsappToken: optional("WHATSAPP_CLOUD_API_TOKEN"),
    whatsappPhoneNumberId: optional("WHATSAPP_PHONE_NUMBER_ID"),
  },
};
