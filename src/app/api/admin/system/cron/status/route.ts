import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const cronStates = await prisma.cronState.findMany({
    orderBy: { updatedAt: "desc" },
  });

  // Also get recent task stats
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentTasks = await prisma.agentTask.findMany({
    where: { updatedAt: { gte: oneHourAgo } },
    select: { type: true, status: true, updatedAt: true },
  });

  return NextResponse.json({
    cronStates: cronStates.map((c) => ({
      key: c.key,
      updatedAt: c.updatedAt,
      date: c.date,
      value: c.value.slice(0, 200), // truncate for display
    })),
    recentTaskSummary: {
      completed: recentTasks.filter((t) => t.status === "completed").length,
      failed: recentTasks.filter((t) => t.status === "failed").length,
      processing: recentTasks.filter((t) => t.status === "processing").length,
    },
  });
}
