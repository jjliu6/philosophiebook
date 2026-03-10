import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const DAILY_COMMENT_LIMIT = 10;

/** GET /api/comments?topicId=xxx */
export async function GET(request: NextRequest) {
  const topicId = request.nextUrl.searchParams.get("topicId");
  if (!topicId) {
    return NextResponse.json({ error: "topicId is required" }, { status: 400 });
  }

  const comments = await prisma.comment.findMany({
    where: { topicId },
    include: {
      user: { select: { id: true, username: true, role: true } },
      thinkerReplies: {
        include: {
          thinker: { select: { id: true, name: true, color: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      commentLikes: { select: { userId: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ comments });
}

/** POST /api/comments — create a comment */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { topicId, content } = await request.json();

    if (!topicId || !content?.trim()) {
      return NextResponse.json({ error: "topicId and content are required" }, { status: 400 });
    }

    if (content.trim().length > 2000) {
      return NextResponse.json({ error: "Comment too long (max 2000 chars)" }, { status: 400 });
    }

    // Check daily limit
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { dailyCommentCount: true },
    });

    if (dbUser && dbUser.dailyCommentCount >= DAILY_COMMENT_LIMIT) {
      return NextResponse.json(
        { error: `Daily comment limit reached (${DAILY_COMMENT_LIMIT})` },
        { status: 429 }
      );
    }

    // Create comment and increment daily count in transaction
    const [comment] = await prisma.$transaction([
      prisma.comment.create({
        data: {
          topicId,
          userId: user.id,
          content: content.trim(),
        },
        include: {
          user: { select: { id: true, username: true, role: true } },
          thinkerReplies: {
            include: {
              thinker: { select: { id: true, name: true, color: true } },
            },
          },
          commentLikes: { select: { userId: true } },
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { dailyCommentCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Comment creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
