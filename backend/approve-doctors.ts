import { PrismaClient } from "./prisma/generated/client/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.doctor.updateMany({
    data: { approvalStatus: "APPROVED" as any },
  });
  console.log(`✅  Updated ${result.count} doctor(s) → APPROVED`);
}

main()
  .catch((e) => { console.error(e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
