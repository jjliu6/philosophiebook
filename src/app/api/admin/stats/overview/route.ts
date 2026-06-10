import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const [
    topicCount,
    responseCount,
    commentCount,
    userCount,
    thinkerCount,
    agentKeyCount,
    pendingTasks,
    processingTasks,
    failedTasks,
    completedTasks,
  ] = await Promise.all([
    prisma.topic.count(),
    prisma.response.count(),
    prisma.comment.count(),
    prisma.user.count({ where: { role: "human" } }),
    prisma.thinker.count(),
    prisma.agentApiKey.count({ where: { isActive: true } }),
    prisma.agentTask.count({ where: { status: "pending" } }),
    prisma.agentTask.count({ where: { status: "processing" } }),
    prisma.agentTask.count({ where: { status: "failed" } }),
    prisma.agentTask.count({ where: { status: "completed" } }),
  ]);

  // Last cron runs
  const cronStates = await prisma.cronState.findMany();
  const cronStatus = Object.fromEntries(
    cronStates.map((c) => [c.key, { updatedAt: c.updatedAt, date: c.date }])
  );

  return NextResponse.json({
    topics: topicCount,
    responses: responseCount,
    comments: commentCount,
    users: userCount,
    thinkers: thinkerCount,
    activeAgentKeys: agentKeyCount,
    taskQueue: {
      pending: pendingTasks,
      processing: processingTasks,
      failed: failedTasks,
      completed: completedTasks,
    },
    cronStatus,
  });
}
