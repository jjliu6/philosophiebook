import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const topics = await prisma.topic.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, title: true, createdAt: true, _count: { select: { responses: true } } },
  });
  for (const t of topics) {
    console.log(`${t.id} | ${t._count.responses} responses | "${t.title}"`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
