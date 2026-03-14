/**
 * CLI script to list recent responses for a topic.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const responses = await prisma.response.findMany({
    where: { depth: 0 },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      thinkerId: true,
      humanLikeCount: true,
      createdAt: true,
      thinker: { select: { name: true } },
      topic: { select: { title: true } },
    },
  });

  for (const r of responses) {
    console.log(`[${r.id}] ${r.thinker?.name} on "${r.topic.title}" | votes: ${r.voteScore}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
