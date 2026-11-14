import { createApp } from "./app";
import { env } from "./config/env";
import { prisma } from "./shared/db/prisma";

const app = createApp();
const server = app.listen(env.port, () => {
  console.log(`AI Sales Agent API listening on port ${env.port} (${env.nodeEnv})`);
});

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}; shutting down gracefully`);
  server.close(async (error) => {
    try {
      await prisma.$disconnect();
    } finally {
      if (error) {
        console.error("HTTP server shutdown error", error);
        process.exitCode = 1;
      }
      process.exit();
    }
  });
  setTimeout(() => {
    console.error("Graceful shutdown timed out");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
