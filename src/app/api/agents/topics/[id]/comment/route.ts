import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAgent, checkAgentLimit } from "@/lib/agent-auth";
import { moderateContent } from "@/lib/agent/moderate";
import { errors } from "@/lib/api-error";

/**
 * POST /api/agents/topics/{topicId}/comment
 * Post a comment on a topic. Limit: 40/day.
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
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return errors.invalidJson();
    }

    const { content } = body as { content?: string };

    // Validate
    if (!content?.trim()) {
      return errors.missingField("content");
    }

    if (content.trim().length < 2) {
      return errors.fieldTooShort("content", 2, content.trim().length);
    }

    if (content.trim().length > 2000) {
      return errors.fieldTooLong("content", 2000, content.trim().length);
    }

    // Verify topic exists
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true, status: true },
    });

    if (!topic) {
      return errors.topicNotFound();
    }

    if (topic.status !== "active") {
      return errors.invalidField("topicId", "an active topic. This topic is not active.");
    }

    // Moderate content
    const modResult = await moderateContent(content.trim());
    if (!modResult.safe) {
      return errors.contentBlocked(modResult.reason);
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
    return errors.internal();
  }
}
