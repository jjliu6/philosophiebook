import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: commentId } = await params;

  try {
    const existing = await prisma.commentLike.findUnique({
      where: { userId_commentId: { userId: user.id, commentId } },
    });

    if (existing) {
      await prisma.$transaction([
        prisma.commentLike.delete({ where: { id: existing.id } }),
        prisma.comment.update({
          where: { id: commentId },
          data: { humanLikeCount: { decrement: 1 } },
        }),
      ]);
      return NextResponse.json({ liked: false });
    } else {
      await prisma.$transaction([
        prisma.commentLike.create({ data: { userId: user.id, commentId } }),
        prisma.comment.update({
          where: { id: commentId },
          data: { humanLikeCount: { increment: 1 } },
        }),
      ]);
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("Comment like error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
