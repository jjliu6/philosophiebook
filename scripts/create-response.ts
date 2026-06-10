/**
 * CLI script to create a thinker's response to a topic.
 * Used by Claude Code to insert AI-generated responses without the Anthropic API.
 *
 * Usage:
 *   npx tsx scripts/create-response.ts \
 *     --topicId "clxxx..." \
 *     --thinkerId "confucius" \
 *     --content "The response text..."
 *
 * Optional flags:
 *   --parentResponseId "clxxx..."  (for replies to other responses)
 *   --position 0                   (explicit position, auto-calculated if omitted)
 *
 * Available thinker IDs:
 *   confucius, mencius, laozi, zhuangzi, hanfeizi, mozi, buddha,
 *   socrates, plato, aristotle, aurelius, machiavelli, nietzsche,
 *   beauvoir, arendt
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function parseArgs() {
  const args = process.argv.slice(2);
  const result: Record<string, string> = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, "");
    result[key] = args[i + 1];
  }

  return result;
}

async function main() {
  const args = parseArgs();

  if (!args.topicId || !args.thinkerId || !args.content) {
    console.error("Error: --topicId, --thinkerId, and --content are required");
    process.exit(1);
  }

  const { topicId, thinkerId, content, parentResponseId } = args;

  // Verify topic exists
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    select: { title: true },
  });
  if (!topic) {
    console.error(`Error: Topic not found: ${topicId}`);
    process.exit(1);
  }

  // Verify thinker exists
  const thinker = await prisma.thinker.findUnique({
    where: { id: thinkerId },
    select: { name: true },
  });
  if (!thinker) {
    console.error(`Error: Thinker not found: ${thinkerId}`);
    process.exit(1);
  }

  // Calculate depth and position
  let depth = 0;
  let position: number;

  if (parentResponseId) {
    const parent = await prisma.response.findUnique({
      where: { id: parentResponseId },
      select: { depth: true },
    });
    if (!parent) {
      console.error(`Error: Parent response not found: ${parentResponseId}`);
      process.exit(1);
    }
    depth = parent.depth + 1;
    if (depth > 2) {
      console.error("Error: Max reply depth (2) reached");
      process.exit(1);
    }

    // Count existing siblings
    const siblingCount = await prisma.response.count({
      where: { parentResponseId },
    });
    position = args.position ? parseInt(args.position) : siblingCount;
  } else {
    // Top-level: count existing top-level responses
    const topLevelCount = await prisma.response.count({
      where: { topicId, depth: 0 },
    });
    position = args.position ? parseInt(args.position) : topLevelCount;
  }

  const response = await prisma.response.create({
    data: {
      topicId,
      thinkerId,
      content: content.trim(),
      position,
      depth,
      parentResponseId: parentResponseId || null,
    },
  });

  console.log(`✅ Response created: ${response.id}`);
  console.log(`   Thinker: ${thinker.name}`);
  console.log(`   Topic: ${topic.title}`);
  console.log(`   Depth: ${depth}, Position: ${position}`);

  // Mark corresponding AgentTask as completed if it exists
  const matchingTask = await prisma.agentTask.findFirst({
    where: {
      topicId,
      thinkerId,
      type: parentResponseId ? "reply" : "topic_response",
      status: { in: ["pending", "processing"] },
    },
  });

  if (matchingTask) {
    await prisma.agentTask.update({
      where: { id: matchingTask.id },
      data: { status: "completed" },
    });
    console.log(`   📋 Marked task ${matchingTask.id} as completed`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
