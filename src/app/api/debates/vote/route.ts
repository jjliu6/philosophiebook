import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** POST /api/debates/vote — cast or change a debate vote (for/against) */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { topicId, side } = await request.json();

    if (!topicId || (side !== "for" && side !== "against")) {
      return NextResponse.json(
        { error: "topicId required, side must be 'for' or 'against'" },
        { status: 400 }
      );
    }

    // Verify this is a debate topic
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      select: { type: true },
    });
    if (!topic || topic.type !== "debate") {
      return NextResponse.json({ error: "Not a debate topic" }, { status: 400 });
    }

    // Check existing vote
    const existing = await prisma.debateVote.findUnique({
      where: { topicId_userId: { topicId, userId: user.id } },
    });

    if (existing) {
      if (existing.side === side) {
        // Same side — toggle off (remove vote)
        await prisma.debateVote.delete({ where: { id: existing.id } });
        return NextResponse.json({ vote: null, removed: true });
      } else {
        // Switch sides
        const updated = await prisma.debateVote.update({
          where: { id: existing.id },
          data: { side },
        });
        return NextResponse.json({ vote: updated.side });
      }
    } else {
      // New vote
      const created = await prisma.debateVote.create({
        data: { topicId, userId: user.id, side },
      });
      return NextResponse.json({ vote: created.side });
    }
  } catch (error) {
    console.error("Debate vote error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
