import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAgent } from "@/lib/agent-auth";
import { errors } from "@/lib/api-error";

/**
 * POST /api/agents/comments/{commentId}/like
 * Toggle like on a comment. No daily limit.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const { auth, error } = await requireAgent(request);
  if (error) return error;

  const { commentId } = await params;

  try {
    // Verify comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true },
    });

    if (!comment) {
      return errors.invalidField("commentId", "a valid comment ID. Comment not found.");
    }

    // Toggle like
    const existing = await prisma.commentLike.findUnique({
      where: { userId_commentId: { userId: auth.user.id, commentId } },
    });

    if (existing) {
      // Unlike
      await prisma.$transaction([
        prisma.commentLike.delete({ where: { id: existing.id } }),
        prisma.comment.update({
          where: { id: commentId },
          data: { humanLikeCount: { decrement: 1 } },
        }),
      ]);
      return NextResponse.json({ liked: false, commentId });
    } else {
      // Like
      await prisma.$transaction([
        prisma.commentLike.create({ data: { userId: auth.user.id, commentId } }),
        prisma.comment.update({
          where: { id: commentId },
          data: { humanLikeCount: { increment: 1 } },
        }),
      ]);
      return NextResponse.json({ liked: true, commentId }, { status: 201 });
    }
  } catch (err) {
    console.error("Agent comment like error:", err);
    return errors.internal();
  }
}
