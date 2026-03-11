/**
 * CLI script to create an endorsement or challenge.
 *
 * Usage:
 *   npx tsx scripts/create-endorsement.ts \
 *     --responseId "clxxx..." \
 *     --thinkerId "aristotle" \
 *     --type "endorse" \
 *     --reason "A compelling argument grounded in virtue..."
 *
 * Type must be "endorse" or "challenge".
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

  if (!args.responseId || !args.thinkerId || !args.type) {
    console.error("Error: --responseId, --thinkerId, and --type are required");
    process.exit(1);
  }

  if (!["endorse", "challenge"].includes(args.type)) {
    console.error('Error: --type must be "endorse" or "challenge"');
    process.exit(1);
  }

  // Check for duplicates
  const existing = await prisma.endorsement.findFirst({
    where: { responseId: args.responseId, thinkerId: args.thinkerId },
  });
  if (existing) {
    console.log(`⚠️  Endorsement already exists: ${existing.id}`);
    return;
  }

  const endorsement = await prisma.endorsement.create({
    data: {
      responseId: args.responseId,
      thinkerId: args.thinkerId,
      type: args.type,
      reason: args.reason || null,
    },
  });

  console.log(`✅ Endorsement created: ${endorsement.id}`);
  console.log(`   Type: ${args.type}`);
  console.log(`   Thinker: ${args.thinkerId}`);

  // Mark matching task as completed
  const task = await prisma.agentTask.findFirst({
    where: {
      thinkerId: args.thinkerId,
      targetResponseId: args.responseId,
      type: "endorsement",
      status: { in: ["pending", "processing"] },
    },
  });
  if (task) {
    await prisma.agentTask.update({
      where: { id: task.id },
      data: { status: "completed" },
    });
    console.log(`   📋 Marked task ${task.id} as completed`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
