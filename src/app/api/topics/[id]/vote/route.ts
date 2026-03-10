import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** POST /api/topics/[id]/vote — upvote or downvote a topic */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: topicId } = await params;

  try {
    const { value } = await request.json();

    if (value !== 1 && value !== -1) {
      return NextResponse.json(
        { error: "value must be 1 (upvote) or -1 (downvote)" },
        { status: 400 }
      );
    }

    // Check if user already voted
    const existing = await prisma.topicVote.findUnique({
      where: { topicId_userId: { topicId, userId: user.id } },
    });

    if (existing) {
      if (existing.value === value) {
        // Same vote — remove it (toggle off)
        await prisma.$transaction([
          prisma.topicVote.delete({ where: { id: existing.id } }),
          prisma.topic.update({
            where: { id: topicId },
            data: { voteScore: { increment: -value } },
          }),
        ]);
        return NextResponse.json({ vote: null, removed: true });
      } else {
        // Different vote — flip it (e.g., upvote → downvote = -2 delta)
        await prisma.$transaction([
          prisma.topicVote.update({
            where: { id: existing.id },
            data: { value },
          }),
          prisma.topic.update({
            where: { id: topicId },
            data: { voteScore: { increment: value * 2 } },
          }),
        ]);
        return NextResponse.json({ vote: value });
      }
    } else {
      // New vote
      await prisma.$transaction([
        prisma.topicVote.create({
          data: { topicId, userId: user.id, value },
        }),
        prisma.topic.update({
          where: { id: topicId },
          data: { voteScore: { increment: value } },
        }),
      ]);
      return NextResponse.json({ vote: value });
    }
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
