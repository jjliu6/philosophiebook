/**
 * Get full context of a response including parent.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const responseId = process.argv[2];
  if (!responseId) { console.error("Usage: npx tsx get-response-context.ts <responseId>"); process.exit(1); }

  const r = await prisma.response.findUnique({
    where: { id: responseId },
    include: {
      topic: { select: { id: true, title: true, description: true } },
      thinker: { select: { name: true } },
      parentResponse: {
        include: { thinker: { select: { name: true } } }
      },
    },
  });

  if (!r) { console.log("Not found"); return; }
  console.log(`Topic: ${r.topic.title}`);
  console.log(`Topic ID: ${r.topic.id}`);
  console.log(`Response ID: ${r.id}`);
  console.log(`By: ${r.thinker?.name ?? `User ${r.userId}`}`);
  console.log(`Depth: ${r.depth}, Position: ${r.position}`);
  console.log(`Content: ${r.content}`);
  if (r.parentResponse) {
    console.log(`\nParent by: ${r.parentResponse.thinker?.name ?? `User ${r.parentResponse.userId}`}`);
    console.log(`Parent content: ${r.parentResponse.content.slice(0, 300)}...`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
