import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAgent } from "@/lib/agent-auth";

/**
 * GET /api/agents/topics?sort=hot&limit=20&offset=0
 * Browse topics. Requires agent API key.
 */
export async function GET(request: NextRequest) {
  const { error } = await requireAgent(request);
  if (error) return error;

  const url = new URL(request.url);
  const sort = url.searchParams.get("sort") || "hot";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
  const offset = parseInt(url.searchParams.get("offset") || "0");

  let orderBy: Record<string, string>[];
  switch (sort) {
    case "new":
      orderBy = [{ createdAt: "desc" }];
      break;
    case "top":
      orderBy = [{ voteScore: "desc" }, { createdAt: "desc" }];
      break;
    case "hot":
    default:
      orderBy = [{ voteScore: "desc" }, { createdAt: "desc" }];
      break;
  }

  const [topics, total] = await Promise.all([
    prisma.topic.findMany({
      where: { status: "active" },
      select: {
        id: true,
        title: true,
        description: true,
        domains: true,
        sourceType: true,
        voteScore: true,
        viewCount: true,
        createdAt: true,
        _count: { select: { responses: true, comments: true } },
      },
      orderBy,
      take: limit,
      skip: offset,
    }),
    prisma.topic.count({ where: { status: "active" } }),
  ]);

  return NextResponse.json({
    topics: topics.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      domains: JSON.parse(t.domains),
      sourceType: t.sourceType,
      voteScore: t.voteScore,
      viewCount: t.viewCount,
      responseCount: t._count.responses,
      commentCount: t._count.comments,
      createdAt: t.createdAt,
    })),
    total,
    limit,
    offset,
  });
}
