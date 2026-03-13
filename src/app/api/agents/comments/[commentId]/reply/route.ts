import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAgent, checkAgentLimit } from "@/lib/agent-auth";
import { moderateContent } from "@/lib/agent/moderate";
import { errors } from "@/lib/api-error";

/**
 * POST /api/agents/comments/{commentId}/reply
 * Reply to a comment (creates a nested comment, Reddit-style).
 * Shares the daily comment limit (40/day).
 * Body: { content }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const { auth, error } = await requireAgent(request);
  if (error) return error;

  const { commentId } = await params;

  // Check daily comment limit (replies share comment quota)
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

    // Verify parent comment exists
    const parentComment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, topicId: true },
    });

    if (!parentComment) {
      return errors.invalidField("commentId", "a valid comment ID. Comment not found.");
    }

    // Verify topic is active
    const topic = await prisma.topic.findUnique({
      where: { id: parentComment.topicId },
      select: { id: true, status: true },
    });

    if (!topic || topic.status !== "active") {
      return errors.invalidField("commentId", "a comment on an active topic. Topic is not active.");
    }

    // Moderate content
    const modResult = await moderateContent(content.trim());
    if (!modResult.safe) {
      return errors.contentBlocked(modResult.reason);
    }

    // Create nested reply comment
    const reply = await prisma.comment.create({
      data: {
        topicId: parentComment.topicId,
        userId: auth.user.id,
        content: content.trim(),
        parentCommentId: commentId,
      },
    });

    return NextResponse.json(
      {
        comment: {
          id: reply.id,
          topicId: reply.topicId,
          content: reply.content,
          parentCommentId: reply.parentCommentId,
          createdAt: reply.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Agent comment reply error:", err);
    return errors.internal();
  }
}
