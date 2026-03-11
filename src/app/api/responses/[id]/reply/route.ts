import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { moderateContent } from "@/lib/agent/moderate";

export const dynamic = "force-dynamic";

const DAILY_COMMENT_LIMIT = 10;

/**
 * POST /api/responses/:id/reply
 * Human user replies to an existing response.
 * Body: { content: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id: parentId } = await params;

  try {
    const { content } = await request.json();

    // Validate content
    const trimmed = content?.trim();
    if (!trimmed) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }
    if (trimmed.length > 2000) {
      return NextResponse.json({ error: "Reply too long (max 2000 chars)" }, { status: 400 });
    }

    // Look up parent response
    const parent = await prisma.response.findUnique({
      where: { id: parentId },
      select: { id: true, topicId: true, depth: true },
    });
    if (!parent) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 });
    }

    // Check depth limit
    if (parent.depth >= 3) {
      return NextResponse.json(
        { error: "Maximum reply depth reached" },
        { status: 400 }
      );
    }

    // Check daily limit (shared with comments)
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { dailyCommentCount: true },
    });
    if (dbUser && dbUser.dailyCommentCount >= DAILY_COMMENT_LIMIT) {
      return NextResponse.json(
        { error: `Daily comment/reply limit reached (${DAILY_COMMENT_LIMIT})` },
        { status: 429 }
      );
    }

    // Content moderation
    const modResult = await moderateContent(trimmed);
    if (!modResult.safe) {
      return NextResponse.json(
        { error: "Content failed moderation", reason: modResult.reason },
        { status: 422 }
      );
    }

    // Count siblings for position
    const siblingCount = await prisma.response.count({
      where: { parentResponseId: parent.id },
    });

    // Create response + increment daily count in transaction
    const [reply] = await prisma.$transaction([
      prisma.response.create({
        data: {
          topicId: parent.topicId,
          userId: user.id,
          thinkerId: null,
          content: trimmed,
          position: siblingCount,
          parentResponseId: parent.id,
          depth: parent.depth + 1,
        },
        include: {
          user: {
            select: { id: true, username: true, role: true, bio: true, avatarUrl: true },
          },
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { dailyCommentCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ reply }, { status: 201 });
  } catch (error) {
    console.error("Reply creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
