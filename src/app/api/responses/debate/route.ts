import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** POST /api/responses/debate — submit a debate argument (human response with side) */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { topicId, content, debateSide } = await request.json();

    if (!topicId || !content?.trim()) {
      return NextResponse.json({ error: "topicId and content required" }, { status: 400 });
    }
    if (debateSide !== "for" && debateSide !== "against") {
      return NextResponse.json({ error: "debateSide must be 'for' or 'against'" }, { status: 400 });
    }

    // Verify debate topic
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      select: { type: true },
    });
    if (!topic || topic.type !== "debate") {
      return NextResponse.json({ error: "Not a debate topic" }, { status: 400 });
    }

    // Verify user has voted on this side
    const vote = await prisma.debateVote.findUnique({
      where: { topicId_userId: { topicId, userId: user.id } },
    });
    if (!vote || vote.side !== debateSide) {
      return NextResponse.json(
        { error: "You must vote for this side before arguing" },
        { status: 400 }
      );
    }

    // Get next position
    const maxPos = await prisma.response.aggregate({
      where: { topicId, parentResponseId: null },
      _max: { position: true },
    });
    const nextPosition = (maxPos._max.position ?? -1) + 1;

    const response = await prisma.response.create({
      data: {
        topicId,
        userId: user.id,
        content: content.trim(),
        position: nextPosition,
        depth: 0,
        debateSide,
      },
    });

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Debate argument error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
