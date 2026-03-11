import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret } from "@/lib/cron-auth";
import { type AIProvider, getProvider } from "@/lib/ai";
import { generateTopicResponse } from "@/lib/agent/generate-response";
import { generateReply } from "@/lib/agent/generate-reply";
import { generateEndorsement } from "@/lib/agent/generate-endorsement";
import { generateTopicVote } from "@/lib/agent/generate-vote";
import { scheduleFollowUps } from "@/lib/agent/scheduler";

const MAX_TASKS_PER_RUN = 3;

async function processTask(
  task: {
    id: string;
    type: string;
    thinkerId: string;
    topicId: string;
    targetResponseId: string | null;
    metadata: string;
  },
  provider?: AIProvider
) {
  const meta = JSON.parse(task.metadata);

  switch (task.type) {
    case "topic_response":
      await generateTopicResponse(
        task.thinkerId,
        task.topicId,
        meta.position ?? 0,
        provider
      );
      break;

    case "reply":
      if (!task.targetResponseId) throw new Error("No targetResponseId for reply task");
      await generateReply(
        task.thinkerId,
        task.targetResponseId,
        meta.relationshipDynamic ?? null,
        provider
      );
      break;

    case "endorsement":
      if (!task.targetResponseId) throw new Error("No targetResponseId for endorsement task");
      await generateEndorsement(
        task.thinkerId,
        task.targetResponseId,
        meta.relationshipType ?? "dialogue",
        provider
      );
      break;

    case "topic_vote":
      await generateTopicVote(task.thinkerId, task.topicId);
      break;

    default:
      throw new Error(`Unknown task type: ${task.type}`);
  }
}

export async function POST(request: NextRequest) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  try {
    // Optional: caller can specify provider via query param
    const url = new URL(request.url);
    const providerParam = url.searchParams.get("provider") as AIProvider | null;
    const provider = providerParam || undefined;
    const selectedProvider = getProvider(provider);

    // Fetch pending tasks that are due
    const tasks = await prisma.agentTask.findMany({
      where: {
        status: "pending",
        scheduledFor: { lte: new Date() },
      },
      orderBy: [{ priority: "desc" }, { scheduledFor: "asc" }],
      take: MAX_TASKS_PER_RUN,
    });

    if (tasks.length === 0) {
      return NextResponse.json({ processed: 0, remaining: 0, provider: selectedProvider });
    }

    const results: { id: string; type: string; status: string }[] = [];

    for (const task of tasks) {
      // Mark as processing
      await prisma.agentTask.update({
        where: { id: task.id },
        data: { status: "processing", attempts: { increment: 1 } },
      });

      try {
        await processTask(task, provider);
        await prisma.agentTask.update({
          where: { id: task.id },
          data: { status: "completed" },
        });
        results.push({ id: task.id, type: task.type, status: "completed" });
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        console.error(`Task ${task.id} failed:`, errMsg);

        const newStatus = task.attempts >= 2 ? "failed" : "pending";
        await prisma.agentTask.update({
          where: { id: task.id },
          data: { status: newStatus, error: errMsg },
        });
        results.push({ id: task.id, type: task.type, status: newStatus });
      }
    }

    // Check if any topic's opening responses are all completed → schedule follow-ups
    const completedTopicIds = [
      ...new Set(
        results
          .filter((r) => r.type === "topic_response" && r.status === "completed")
          .map((r) => {
            const task = tasks.find((t) => t.id === r.id);
            return task?.topicId;
          })
          .filter(Boolean) as string[]
      ),
    ];

    let followUpsScheduled = 0;
    for (const topicId of completedTopicIds) {
      const pendingResponses = await prisma.agentTask.count({
        where: {
          topicId,
          type: "topic_response",
          status: { in: ["pending", "processing"] },
        },
      });

      if (pendingResponses === 0) {
        const existing = await prisma.agentTask.count({
          where: {
            topicId,
            type: { in: ["reply", "endorsement"] },
          },
        });
        if (existing === 0) {
          followUpsScheduled += await scheduleFollowUps(topicId);
        }
      }
    }

    const remaining = await prisma.agentTask.count({
      where: {
        status: "pending",
        scheduledFor: { lte: new Date() },
      },
    });

    return NextResponse.json({
      provider: selectedProvider,
      processed: results.length,
      results,
      followUpsScheduled,
      remaining,
    });
  } catch (error) {
    console.error("Process tasks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
