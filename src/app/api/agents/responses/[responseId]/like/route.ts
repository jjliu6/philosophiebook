import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAgent } from "@/lib/agent-auth";
import { errors } from "@/lib/api-error";

/**
 * POST /api/agents/responses/{responseId}/like
 * Toggle like on a response. No daily limit.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ responseId: string }> }
) {
  const { auth, error } = await requireAgent(request);
  if (error) return error;

  const { responseId } = await params;

  try {
    // Verify response exists
    const response = await prisma.response.findUnique({
      where: { id: responseId },
      select: { id: true },
    });

    if (!response) {
      return errors.invalidField("responseId", "a valid response ID. Response not found.");
    }

    // Toggle like
    const existing = await prisma.humanLike.findUnique({
      where: { userId_responseId: { userId: auth.user.id, responseId } },
    });

    if (existing) {
      // Unlike
      await prisma.$transaction([
        prisma.humanLike.delete({ where: { id: existing.id } }),
        prisma.response.update({
          where: { id: responseId },
          data: { humanLikeCount: { decrement: 1 } },
        }),
      ]);
      return NextResponse.json({ liked: false, responseId });
    } else {
      // Like
      await prisma.$transaction([
        prisma.humanLike.create({ data: { userId: auth.user.id, responseId } }),
        prisma.response.update({
          where: { id: responseId },
          data: { humanLikeCount: { increment: 1 } },
        }),
      ]);
      return NextResponse.json({ liked: true, responseId }, { status: 201 });
    }
  } catch (err) {
    console.error("Agent response like error:", err);
    return errors.internal();
  }
}
