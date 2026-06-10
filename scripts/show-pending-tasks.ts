/**
 * CLI script to show pending agent tasks.
 * Useful for Claude Code to see what responses need to be generated.
 *
 * Usage:
 *   npx tsx scripts/show-pending-tasks.ts
 *   npx tsx scripts/show-pending-tasks.ts --topicId "clxxx..."
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

  const where: Record<string, unknown> = {
    status: { in: ["pending", "processing"] },
  };
  if (args.topicId) where.topicId = args.topicId;

  const tasks = await prisma.agentTask.findMany({
    where,
    orderBy: [{ priority: "desc" }, { scheduledFor: "asc" }],
    include: {
      thinker: { select: { name: true } },
      topic: { select: { title: true } },
    },
  });

  if (tasks.length === 0) {
    console.log("✅ No pending tasks!");
    return;
  }

  console.log(`📋 ${tasks.length} pending tasks:\n`);

  for (const task of tasks) {
    const meta = JSON.parse(task.metadata);
    const due = task.scheduledFor <= new Date() ? "⏰ DUE NOW" : `⏳ ${task.scheduledFor.toISOString()}`;

    console.log(`[${task.type}] ${task.thinker.name} → "${task.topic.title}"`);
    console.log(`  ID: ${task.id}`);
    console.log(`  Status: ${task.status} | Priority: ${task.priority} | ${due}`);

    if (task.type === "topic_response") {
      console.log(`  Position: ${meta.position ?? "?"}`);
    } else if (task.type === "reply" && task.targetResponseId) {
      console.log(`  Reply to response: ${task.targetResponseId}`);
      if (meta.relationshipDynamic) {
        console.log(`  Relationship: ${meta.relationshipDynamic.slice(0, 100)}...`);
      }
    } else if (task.type === "endorsement" && task.targetResponseId) {
      console.log(`  Endorse/challenge response: ${task.targetResponseId}`);
    }
    console.log();
  }

  // Also show topic context for the tasks
  const topicIds = [...new Set(tasks.map((t) => t.topicId))];
  for (const topicId of topicIds) {
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      select: {
        title: true,
        description: true,
        domains: true,
        responses: {
          select: {
            id: true,
            thinkerId: true,
            content: true,
            position: true,
            depth: true,
            thinker: { select: { name: true } },
          },
          where: { depth: 0 },
          orderBy: { position: "asc" },
        },
      },
    });

    if (topic && topic.responses.length > 0) {
      console.log(`--- Existing responses for "${topic.title}" ---`);
      for (const r of topic.responses) {
        console.log(`  [${r.position}] ${r.thinker?.name ?? "Agent"}: ${r.content.slice(0, 150)}...`);
      }
      console.log();
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
