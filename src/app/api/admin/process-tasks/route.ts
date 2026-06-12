import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret } from "@/lib/cron-auth";
import { type AIProvider, getProvider } from "@/lib/ai";
import { generateTopicResponse } from "@/lib/agent/generate-response";
import { generateReply } from "@/lib/agent/generate-reply";
import { generateEndorsement } from "@/lib/agent/generate-endorsement";
import { generateTopicVote } from "@/lib/agent/generate-vote";
import { generateDebateArgument } from "@/lib/agent/generate-debate-response";
import { scheduleFollowUps } from "@/lib/agent/scheduler";

/**
 * POST /api/admin/process-tasks?provider=gemini
 * Manual trigger for processing agent tasks.
 * Accepts optional { topicId, limit } in body.
 * Optional `provider` query param: "claude" | "gemini"
 */
export async function POST(request: NextRequest) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const providerParam = url.searchParams.get("provider") as AIProvider | null;
    const provider = providerParam || undefined;
    const selectedProvider = getProvider(provider);

    const body = await request.json().catch(() => ({}));
    const topicId = body.topicId as string | undefined;
    const limit = Math.min(body.limit ?? 5, 10);

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

    if (tasks.length === 0) {
      const futureTasks = topicId
        ? await prisma.agentTask.count({
            where: { topicId, status: "pending" },
          })
        : 0;

      return NextResponse.json({
        provider: selectedProvider,
        processed: 0,
        message: futureTasks > 0
          ? `No tasks due yet. ${futureTasks} tasks scheduled for later.`
          : "No pending tasks found.",
      });
    }

    const results: { id: string; type: string; thinkerId: string; status: string; error?: string }[] = [];

    for (const task of tasks) {
      await prisma.agentTask.update({
        where: { id: task.id },
        data: { status: "processing", attempts: { increment: 1 } },
      });

      try {
        const meta = JSON.parse(task.metadata);

        switch (task.type) {
          case "topic_response":
            await generateTopicResponse(task.thinkerId, task.topicId, meta.position ?? 0, provider, meta.lengthHint);
            break;
          case "reply":
            if (!task.targetResponseId) throw new Error("Missing targetResponseId");
            await generateReply(task.thinkerId, task.targetResponseId, meta.relationshipDynamic ?? null, provider, meta.lengthHint);
            break;
          case "endorsement":
            if (!task.targetResponseId) throw new Error("Missing targetResponseId");
            await generateEndorsement(task.thinkerId, task.targetResponseId, meta.relationshipType ?? "dialogue", provider);
            break;
          case "debate_argument":
            await generateDebateArgument(
              task.thinkerId,
              task.topicId,
              meta.debateSide ?? "for",
              meta.position ?? 0,
              provider,
              meta.lengthHint
            );
            break;
          case "topic_vote":
            await generateTopicVote(task.thinkerId, task.topicId);
            break;
          default:
            throw new Error(`Unknown task type: ${task.type}`);
        }

        await prisma.agentTask.update({
          where: { id: task.id },
          data: { status: "completed" },
        });
        results.push({ id: task.id, type: task.type, thinkerId: task.thinkerId, status: "completed" });
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        console.error(`Task ${task.id} failed:`, errMsg);
        const newStatus = task.attempts >= 2 ? "failed" : "pending";
        await prisma.agentTask.update({
          where: { id: task.id },
          data: { status: newStatus, error: errMsg },
        });
        results.push({ id: task.id, type: task.type, thinkerId: task.thinkerId, status: newStatus, error: errMsg });
      }
    }

    const completedTopicResponseIds = [
      ...new Set(
        results
          .filter((r) => r.type === "topic_response" && r.status === "completed")
          .map((r) => {
            const t = tasks.find((t) => t.id === r.id);
            return t?.topicId;
          })
          .filter(Boolean) as string[]
      ),
    ];

    let followUpsScheduled = 0;
    for (const tid of completedTopicResponseIds) {
      const pending = await prisma.agentTask.count({
        where: { topicId: tid, type: "topic_response", status: { in: ["pending", "processing"] } },
      });
      if (pending === 0) {
        const existingFollowUps = await prisma.agentTask.count({
          where: { topicId: tid, type: { in: ["reply", "endorsement"] } },
        });
        if (existingFollowUps === 0) {
          followUpsScheduled += await scheduleFollowUps(tid);
        }
      }
    }

    const remaining = await prisma.agentTask.count({
      where: { status: "pending", ...(topicId ? { topicId } : {}) },
    });

    return NextResponse.json({ provider: selectedProvider, processed: results.length, results, followUpsScheduled, remaining });
  } catch (error) {
    console.error("Admin process tasks error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
