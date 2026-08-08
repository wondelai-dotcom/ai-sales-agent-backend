import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Seed minimo indispensabile: ruoli e permessi base.
// Da eseguire una volta dopo la prima migrazione (npm run prisma:migrate),
// altrimenti authService.register fallisce (cerca il ruolo OWNER).
async function main() {
  const roles = ["OWNER", "ADMIN", "MANAGER", "OPERATOR"] as const;
  for (const name of roles) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log("Seed completato: ruoli creati.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
