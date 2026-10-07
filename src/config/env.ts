import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Variabile d'ambiente mancante: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),

  databaseUrl: required("DATABASE_URL"),

  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET"),
    refreshSecret: required("JWT_REFRESH_SECRET"),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "30d",
  },

  // Integrazioni esterne: lette qui ma usate solo dai rispettivi servizi
  // in modules/ai, modules/billing, modules/whatsapp, modules/notifications.
  // Finche' le chiavi non sono configurate, quei servizi restano stub/no-op.
  integrations: {
    openaiApiKey: process.env.OPENAI_API_KEY ?? "",
    stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID ?? "",
    whatsappToken: process.env.WHATSAPP_CLOUD_API_TOKEN ?? "",
    whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
  },
};
