/**
 * CLI script to process pending agent tasks.
 * Runs the AI generation directly (no web server needed).
 *
 * Usage:
 *   npx tsx scripts/process-tasks.ts [--topicId <id>] [--limit 10] [--provider gemini|claude]
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

// Dynamic imports to handle path aliases via tsx
const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const flags: Record<string, string> = {};
  for (let i = 0; i < args.length; i += 2) {
    flags[args[i].replace(/^--/, "")] = args[i + 1];
  }

  const topicId = flags.topicId;
  const limit = Math.min(parseInt(flags.limit || "10"), 20);
  const provider = (flags.provider || undefined) as "claude" | "gemini" | undefined;

  const backdateResponses = flags.backdate === "true";

  // We need to use dynamic imports because of path aliases
  const { generateText } = await import("../src/lib/ai");
  const { getThinker } = await import("../src/personas");
  const { responseUserPrompt, endorsementUserPrompt, replyUserPrompt, debateArgumentUserPrompt } = await import("../src/lib/ai-prompts");
  const { scheduleFollowUps } = await import("../src/lib/agent/scheduler");

  // Helper: generate a natural-looking createdAt relative to topic creation
  async function getBackdatedTime(topicId: string, position: number): Promise<Date | undefined> {
    if (!backdateResponses) return undefined;
    const topic = await prisma.topic.findUnique({ where: { id: topicId }, select: { createdAt: true } });
    if (!topic) return undefined;
    // First response: 20-90 min after topic. Each subsequent: 40-180 min more.
    const baseOffsetMs = (20 + Math.random() * 70) * 60 * 1000;
    const perPositionMs = position * (40 + Math.random() * 140) * 60 * 1000;
    return new Date(topic.createdAt.getTime() + baseOffsetMs + perPositionMs);
  }

  const where: Record<string, unknown> = {
    status: "pending",
    scheduledFor: { lte: new Date() },
  };
  if (topicId) where.topicId = topicId;

  const tasks = await prisma.agentTask.findMany({
    where,
    orderBy: [{ priority: "desc" }, { scheduledFor: "asc" }],
    take: limit,
  });

  console.log(`Found ${tasks.length} tasks to process`);
  if (tasks.length === 0) return;

  let completed = 0;
  const completedTopicIds = new Set<string>();

  for (const task of tasks) {
    console.log(`\nProcessing: ${task.type} | ${task.thinkerId} | topic:${task.topicId.slice(0, 20)}...`);

    await prisma.agentTask.update({
      where: { id: task.id },
      data: { status: "processing", attempts: { increment: 1 } },
    });

    try {
      const meta = JSON.parse(task.metadata);

      if (task.type === "topic_response") {
        const persona = getThinker(task.thinkerId);
        if (!persona) throw new Error(`Thinker not found: ${task.thinkerId}`);

        const topic = await prisma.topic.findUnique({
          where: { id: task.topicId },
          select: { title: true, description: true },
        });
        if (!topic) throw new Error(`Topic not found: ${task.topicId}`);

        const existingResponses = await prisma.response.findMany({
          where: { topicId: task.topicId, depth: 0, position: { lt: meta.position ?? 0 } },
          select: { content: true, thinker: { select: { name: true } } },
          orderBy: { position: "asc" },
        });

        const excerpts = existingResponses.map((r: { content: string; thinker: { name: string } | null }) => ({
          thinkerName: r.thinker?.name ?? "Unknown",
          excerpt: r.content.slice(0, 600),
        }));

        const humanComments = await prisma.comment.findMany({
          where: { topicId: task.topicId, parentCommentId: null },
          select: { content: true, user: { select: { username: true } } },
          orderBy: { createdAt: "asc" },
          take: 10,
        });

        const commentExcerpts = humanComments.map((c: { content: string; user: { username: string } }) => ({
          username: c.user.username,
          excerpt: c.content.slice(0, 300),
        }));

        const userPrompt = responseUserPrompt(
          topic.title,
          topic.description,
          excerpts,
          meta.position ?? 0,
          commentExcerpts
        );

        const content = await generateText(persona.systemPromptTemplate, userPrompt, 1500, provider);

        const responseCreatedAt = await getBackdatedTime(task.topicId, meta.position ?? 0);
        await prisma.response.create({
          data: {
            topicId: task.topicId,
            thinkerId: task.thinkerId,
            content: content.trim(),
            position: meta.position ?? 0,
            depth: 0,
            parentResponseId: null,
            ...(responseCreatedAt ? { createdAt: responseCreatedAt } : {}),
          },
        });

        console.log(`  ✅ ${persona.name} responded (${content.trim().length} chars)${responseCreatedAt ? ` [${responseCreatedAt.toISOString().slice(0,16)}]` : ""}`);
        completedTopicIds.add(task.topicId);

      } else if (task.type === "reply") {
        if (!task.targetResponseId) throw new Error("Missing targetResponseId");

        const persona = getThinker(task.thinkerId);
        if (!persona) throw new Error(`Thinker not found: ${task.thinkerId}`);

        const targetResponse = await prisma.response.findUnique({
          where: { id: task.targetResponseId },
          select: {
            content: true,
            topicId: true,
            thinker: { select: { name: true } },
            topic: { select: { title: true } },
          },
        });
        if (!targetResponse) throw new Error("Target response not found");

        const humanComments = await prisma.comment.findMany({
          where: { topicId: targetResponse.topicId, parentCommentId: null },
          select: { content: true, user: { select: { username: true } } },
          orderBy: { createdAt: "asc" },
          take: 5,
        });

        const commentExcerpts = humanComments.map((c: { content: string; user: { username: string } }) => ({
          username: c.user.username,
          excerpt: c.content.slice(0, 150),
        }));

        const userPrompt = replyUserPrompt(
          targetResponse.topic.title,
          targetResponse.thinker?.name ?? "Unknown",
          targetResponse.content,
          meta.relationshipDynamic ?? null,
          commentExcerpts
        );

        const content = await generateText(persona.systemPromptTemplate, userPrompt, 800, provider);

        const replyCreatedAt = await getBackdatedTime(targetResponse.topicId, (meta.position ?? 0) + 4);
        await prisma.response.create({
          data: {
            topicId: targetResponse.topicId,
            thinkerId: task.thinkerId,
            content: content.trim(),
            position: 0,
            depth: meta.depth ?? 1,
            parentResponseId: task.targetResponseId,
            ...(replyCreatedAt ? { createdAt: replyCreatedAt } : {}),
          },
        });

        console.log(`  ✅ ${persona.name} replied (${content.trim().length} chars)${replyCreatedAt ? ` [${replyCreatedAt.toISOString().slice(0,16)}]` : ""}`);

      } else if (task.type === "endorsement") {
        if (!task.targetResponseId) throw new Error("Missing targetResponseId");

        const persona = getThinker(task.thinkerId);
        if (!persona) throw new Error(`Thinker not found: ${task.thinkerId}`);

        const targetResponse = await prisma.response.findUnique({
          where: { id: task.targetResponseId },
          select: {
            content: true,
            thinker: { select: { name: true } },
          },
        });
        if (!targetResponse) throw new Error("Target response not found");

        const humanComments = await prisma.comment.findMany({
          where: { topicId: task.topicId, parentCommentId: null },
          select: { content: true, user: { select: { username: true } } },
          orderBy: { createdAt: "asc" },
          take: 5,
        });

        const commentExcerpts = humanComments.map((c: { content: string; user: { username: string } }) => ({
          username: c.user.username,
          excerpt: c.content.slice(0, 150),
        }));

        const userPrompt = endorsementUserPrompt(
          targetResponse.thinker?.name ?? "Unknown",
          targetResponse.content,
          meta.relationshipType ?? "dialogue",
          commentExcerpts
        );

        const content = await generateText(persona.systemPromptTemplate, userPrompt, 300, provider);

        try {
          const parsed = JSON.parse(content.replace(/```json\n?/g, "").replace(/```/g, "").trim());
          await prisma.endorsement.create({
            data: {
              responseId: task.targetResponseId,
              thinkerId: task.thinkerId,
              type: parsed.type || "endorse",
              reason: parsed.reason || null,
            },
          });
          console.log(`  ✅ ${persona.name} ${parsed.type}d (${parsed.reason?.slice(0, 60)}...)`);
        } catch {
          console.log(`  ⚠️  Could not parse endorsement JSON, skipping`);
        }

      } else if (task.type === "debate_argument") {
        const persona = getThinker(task.thinkerId);
        if (!persona) throw new Error(`Thinker not found: ${task.thinkerId}`);

        const topic = await prisma.topic.findUnique({
          where: { id: task.topicId },
          select: { proposition: true },
        });
        if (!topic?.proposition) throw new Error(`Debate topic missing proposition: ${task.topicId}`);

        const existingArgs = await prisma.response.findMany({
          where: { topicId: task.topicId, depth: 0, debateSide: { not: null } },
          select: {
            content: true,
            debateSide: true,
            thinker: { select: { name: true } },
            user: { select: { username: true } },
          },
          orderBy: { position: "asc" },
        });

        const argExcerpts = existingArgs.map((a: { content: string; debateSide: string | null; thinker: { name: string } | null; user: { username: string } | null }) => ({
          thinkerName: a.thinker?.name ?? a.user?.username ?? "Unknown",
          side: a.debateSide ?? "for",
          excerpt: a.content.slice(0, 600),
        }));

        const side = meta.debateSide ?? "for";
        const userPrompt = debateArgumentUserPrompt(topic.proposition, side, argExcerpts);
        const content = await generateText(persona.systemPromptTemplate, userPrompt, 1500, provider);

        const responseCreatedAt = await getBackdatedTime(task.topicId, meta.position ?? 0);
        await prisma.$transaction([
          prisma.response.create({
            data: {
              topicId: task.topicId,
              thinkerId: task.thinkerId,
              content: content.trim(),
              position: meta.position ?? 0,
              depth: 0,
              parentResponseId: null,
              debateSide: side,
              ...(responseCreatedAt ? { createdAt: responseCreatedAt } : {}),
            },
          }),
          prisma.debateVote.upsert({
            where: { topicId_thinkerId: { topicId: task.topicId, thinkerId: task.thinkerId } },
            create: { topicId: task.topicId, thinkerId: task.thinkerId, side },
            update: { side },
          }),
        ]);

        console.log(`  ✅ ${persona.name} [${side.toUpperCase()}] debated (${content.trim().length} chars)${responseCreatedAt ? ` [${responseCreatedAt.toISOString().slice(0,16)}]` : ""}`);
        completedTopicIds.add(task.topicId);

      } else if (task.type === "topic_vote") {
        // Simple vote based on domain overlap
        const persona = getThinker(task.thinkerId);
        const topic = await prisma.topic.findUnique({
          where: { id: task.topicId },
          select: { domains: true },
        });

        if (persona && topic) {
          const topicDomains = JSON.parse(topic.domains) as string[];
          const overlap = persona.topicDomains.filter((d: string) => topicDomains.includes(d)).length;
          const value = overlap >= 2 ? 1 : Math.random() > 0.3 ? 1 : -1;

          const existing = await prisma.topicVote.findFirst({
            where: { topicId: task.topicId, thinkerId: task.thinkerId },
          });

          if (!existing) {
            await prisma.topicVote.create({
              data: {
                topicId: task.topicId,
                thinkerId: task.thinkerId,
                value,
              },
            });
            await prisma.topic.update({
              where: { id: task.topicId },
              data: { voteScore: { increment: value } },
            });
            console.log(`  ✅ ${persona.name} voted ${value > 0 ? "👍" : "👎"}`);
          } else {
            console.log(`  ⏭️  ${persona.name} already voted`);
          }
        }
      }

      await prisma.agentTask.update({
        where: { id: task.id },
        data: { status: "completed" },
      });
      completed++;

    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      console.error(`  ❌ Failed: ${errMsg}`);
      const newStatus = task.attempts >= 2 ? "failed" : "pending";
      await prisma.agentTask.update({
        where: { id: task.id },
        data: { status: newStatus, error: errMsg },
      });
    }
  }

  // Schedule follow-ups for completed topics
  for (const tid of completedTopicIds) {
    const pending = await prisma.agentTask.count({
      where: { topicId: tid, type: "topic_response", status: { in: ["pending", "processing"] } },
    });
    if (pending === 0) {
      const existingFollowUps = await prisma.agentTask.count({
        where: { topicId: tid, type: { in: ["reply", "endorsement"] } },
      });
      if (existingFollowUps === 0) {
        const n = await scheduleFollowUps(tid);
        if (n > 0) console.log(`\n📋 Scheduled ${n} follow-up tasks for topic ${tid.slice(0, 20)}...`);
      }
    }
  }

  console.log(`\n✅ Done: ${completed}/${tasks.length} tasks processed`);

  const remaining = await prisma.agentTask.count({ where: { status: "pending" } });
  console.log(`📊 ${remaining} tasks still pending`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
