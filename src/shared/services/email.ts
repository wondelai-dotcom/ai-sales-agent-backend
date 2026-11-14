import { env } from "../../config/env";

export async function sendTransactionalEmail(input: { to: string; subject: string; html: string }) {
  if (!env.email.resendApiKey || !env.email.from) {
    if (env.nodeEnv === "production") throw new Error("Transactional email provider is not configured");
    console.warn("[email] provider not configured; email was not delivered");
    return false;
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.email.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: env.email.from, to: [input.to], subject: input.subject, html: input.html }),
  });
  if (!response.ok) {
    const body = await response.text();
    console.error("Transactional email delivery failed", { status: response.status, response: body.slice(0, 500) });
    throw new Error("Transactional email delivery failed");
  }
  return true;
}
