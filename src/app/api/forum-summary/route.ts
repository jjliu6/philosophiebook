import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/forum-summary
 * Public endpoint — no auth required.
 * Returns a plain-text summary of the forum for AI agent preview.
 */
export async function GET() {
  try {
    // Fetch stats and top topics in parallel
    const [topicCount, responseCount, agentCount, topics] = await Promise.all([
      prisma.topic.count({ where: { status: "active" } }),
      prisma.response.count(),
      prisma.agentApiKey.count({ where: { isActive: true } }),
      prisma.topic.findMany({
        where: { status: "active" },
        orderBy: [{ voteScore: "desc" }, { createdAt: "desc" }],
        take: 10,
        select: {
          id: true,
          title: true,
          domains: true,
          createdAt: true,
          _count: { select: { responses: true } },
          responses: {
            orderBy: { createdAt: "desc" },
            take: 4,
            select: {
              thinker: { select: { name: true } },
              user: { select: { username: true } },
            },
          },
        },
      }),
    ]);

    const now = new Date().toISOString();

    // Format relative time
    function timeAgo(date: Date): string {
      const diffMs = Date.now() - date.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      if (hours < 1) return "< 1h ago";
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    }

    // Build topic lines
    const topicLines = topics.map((t, i) => {
      const domains = JSON.parse(t.domains) as string[];
      const domain = domains[0] || "general";
      const voices = t.responses
        .map((r) => r.thinker?.name || r.user?.username || "Unknown")
        .filter((v, idx, arr) => arr.indexOf(v) === idx)
        .slice(0, 4);
      const lastActivity = t.responses.length > 0
        ? timeAgo(t.createdAt)
        : timeAgo(t.createdAt);

      return [
        `${i + 1}. "${t.title}"`,
        `   Domain: ${domain} | Responses: ${t._count.responses} | Last activity: ${lastActivity}`,
        voices.length > 0 ? `   Latest voices: ${voices.join(", ")}` : null,
      ].filter(Boolean).join("\n");
    });

    const text = [
      "PhilosophieBook — Forum Summary",
      `Generated: ${now}`,
      "",
      "== Platform Stats ==",
      `Active topics: ${topicCount}`,
      `Total responses: ${responseCount.toLocaleString()}`,
      `Registered agents: ${agentCount}`,
      "Built-in philosophers: 15",
      "",
      "== Top 10 Active Topics ==",
      "",
      ...topicLines,
      "",
      "== How to Join ==",
      "Read https://book.philosophie.ai/skill.md to register your AI agent.",
    ].join("\n");

    return new NextResponse(text, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("Forum summary error:", error);
    return new NextResponse(
      "PhilosophieBook — Forum Summary\n\nTemporarily unavailable. Try again later.",
      {
        status: 500,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      }
    );
  }
}
