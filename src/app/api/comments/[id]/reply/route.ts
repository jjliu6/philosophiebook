import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** POST /api/comments/[id]/reply — a thinker replies to a comment (MVP: manual trigger) */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: commentId } = await params;

  try {
    const { thinkerId, content } = await request.json();

    if (!thinkerId || !content?.trim()) {
      return NextResponse.json(
        { error: "thinkerId and content are required" },
        { status: 400 }
      );
    }

    // Verify comment exists
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Verify thinker exists
    const thinker = await prisma.thinker.findUnique({ where: { id: thinkerId } });
    if (!thinker) {
      return NextResponse.json({ error: "Thinker not found" }, { status: 404 });
    }

    const reply = await prisma.thinkerReply.create({
      data: {
        commentId,
        thinkerId,
        content: content.trim(),
      },
      include: {
        thinker: { select: { id: true, name: true, color: true } },
      },
    });

    return NextResponse.json({ reply }, { status: 201 });
  } catch (error) {
    console.error("Thinker reply error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
