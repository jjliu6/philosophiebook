/**
 * List recent human responses that might need AI thinker replies.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find responses by human users (no thinkerId)
  const responses = await prisma.response.findMany({
    where: { userId: { not: null }, thinkerId: null },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      content: true,
      depth: true,
      position: true,
      createdAt: true,
      userId: true,
      topic: { select: { id: true, title: true } },
      replies: {
        where: { thinkerId: { not: null } },
        select: { id: true, thinkerId: true },
      },
    },
  });

  if (responses.length === 0) {
    console.log("No human responses found.");
    return;
  }

  console.log(`Found ${responses.length} human responses:\n`);
  for (const r of responses) {
    const aiReplies = r.replies.length;
    console.log(`[${r.id}] on "${r.topic.title}" | depth:${r.depth} | AI replies: ${aiReplies}`);
    console.log(`  Content: ${r.content.slice(0, 200)}...`);
    console.log();
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
