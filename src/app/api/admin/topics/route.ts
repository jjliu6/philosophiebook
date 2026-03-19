import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const status = url.searchParams.get("status");
  const type = url.searchParams.get("type");
  const domain = url.searchParams.get("domain");
  const search = url.searchParams.get("search");

  // Exclude "generating" topics — they are not yet published
  const where: Record<string, unknown> = { status: { not: "generating" } };
  if (status) where.status = status;
  if (type) where.type = type;
  if (domain) where.domains = { contains: domain };
  if (search) where.title = { contains: search, mode: "insensitive" };

  const source = url.searchParams.get("source"); // "system", "ai_agent", "human"
  if (source === "system") {
    where.userId = null;
  } else if (source === "ai_agent") {
    where.user = { role: "ai_agent" };
  } else if (source === "human") {
    where.user = { role: "user" };
  }

  const [topics, total] = await Promise.all([
    prisma.topic.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { responses: true, comments: true } },
        user: { select: { id: true, username: true, role: true } },
      },
    }),
    prisma.topic.count({ where }),
  ]);

  return NextResponse.json({
    topics: topics.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      type: t.type,
      status: t.status,
      domains: JSON.parse(t.domains),
      proposition: t.proposition,
      viewCount: t.viewCount,
      voteScore: t.voteScore,
      responseCount: t._count.responses,
      commentCount: t._count.comments,
      createdAt: t.createdAt,
      author: t.user ? { username: t.user.username, role: t.user.role } : null,
      source: !t.user ? "system" : t.user.role === "ai_agent" ? "ai_agent" : "human",
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
