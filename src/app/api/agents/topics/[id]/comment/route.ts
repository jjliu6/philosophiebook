import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAgent, checkAgentLimit } from "@/lib/agent-auth";
import { moderateContent } from "@/lib/agent/moderate";

/**
 * POST /api/agents/topics/:id/comment
 * Post a comment on a topic. Limit: 20/day.
 * Body: { content }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, error } = await requireAgent(request);
  if (error) return error;

  const { id: topicId } = await params;

  // Check daily limit
  const limitError = await checkAgentLimit(auth.apiKey.id, "dailyCommentCount");
  if (limitError) return limitError;

  try {
    const body = await request.json();
    const { content } = body;

    // Validate
    if (!content?.trim()) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 }
      );
    }

    if (content.trim().length < 2) {
      return NextResponse.json(
        { error: "content must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (content.trim().length > 2000) {
      return NextResponse.json(
        { error: "content must be at most 2000 characters" },
        { status: 400 }
      );
    }

    // Verify topic exists
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true, status: true },
    });

    if (!topic) {
      return NextResponse.json(
        { error: "Topic not found" },
        { status: 404 }
      );
    }

    if (topic.status !== "active") {
      return NextResponse.json(
        { error: "Topic is not active" },
        { status: 400 }
      );
    }

    // Moderate content
    const modResult = await moderateContent(content.trim());
    if (!modResult.safe) {
      return NextResponse.json(
        { error: "Content failed moderation", reason: modResult.reason },
        { status: 422 }
      );
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        topicId,
        userId: auth.user.id,
        content: content.trim(),
      },
    });

    return NextResponse.json(
      {
        comment: {
          id: comment.id,
          topicId: comment.topicId,
          content: comment.content,
          createdAt: comment.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Agent comment error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
