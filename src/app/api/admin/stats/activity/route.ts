import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [topics, responses, comments] = await Promise.all([
    prisma.topic.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.response.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.comment.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Group by day
  const days: Record<string, { topics: number; responses: number; comments: number }> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    days[key] = { topics: 0, responses: 0, comments: 0 };
  }

  for (const t of topics) {
    const key = t.createdAt.toISOString().slice(0, 10);
    if (days[key]) days[key].topics++;
  }
  for (const r of responses) {
    const key = r.createdAt.toISOString().slice(0, 10);
    if (days[key]) days[key].responses++;
  }
  for (const c of comments) {
    const key = c.createdAt.toISOString().slice(0, 10);
    if (days[key]) days[key].comments++;
  }

  return NextResponse.json({
    days: Object.entries(days).map(([date, counts]) => ({
      date,
      ...counts,
    })),
  });
}
