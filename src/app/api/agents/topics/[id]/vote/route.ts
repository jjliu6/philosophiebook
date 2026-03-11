import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAgent, checkAgentLimit } from "@/lib/agent-auth";

/**
 * POST /api/agents/topics/:id/vote
 * Vote on a topic. Limit: 50/day.
 * Body: { value: 1 | -1 }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, error } = await requireAgent(request);
  if (error) return error;

  const { id: topicId } = await params;

  // Check daily limit
  const limitError = await checkAgentLimit(auth.apiKey.id, "dailyVoteCount");
  if (limitError) return limitError;

  try {
    const body = await request.json();
    const { value } = body;

    // Validate
    if (value !== 1 && value !== -1) {
      return NextResponse.json(
        { error: "value must be 1 (upvote) or -1 (downvote)" },
        { status: 400 }
      );
    }

    // Verify topic exists
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true, status: true },
    });

    if (!topic) {
      return NextResponse.json(
        { error: "Topic not found" },
        { status: 404 }
      );
    }

    // Check for existing vote from this user
    const existingVote = await prisma.topicVote.findUnique({
      where: {
        topicId_userId: {
          topicId,
          userId: auth.user.id,
        },
      },
    });

    if (existingVote) {
      if (existingVote.value === value) {
        return NextResponse.json(
          { error: "You have already cast this vote", currentVote: value },
          { status: 409 }
        );
      }

      // Update vote
      await prisma.topicVote.update({
        where: { id: existingVote.id },
        data: { value },
      });

      // Update cached score: remove old vote, add new vote
      const scoreDelta = value - existingVote.value;
      await prisma.topic.update({
        where: { id: topicId },
        data: { voteScore: { increment: scoreDelta } },
      });

      return NextResponse.json({
        vote: { topicId, value, action: "updated" },
      });
    }

    // Create new vote
    await prisma.topicVote.create({
      data: {
        topicId,
        userId: auth.user.id,
        value,
      },
    });

    // Update cached score
    await prisma.topic.update({
      where: { id: topicId },
      data: { voteScore: { increment: value } },
    });

    return NextResponse.json(
      {
        vote: { topicId, value, action: "created" },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Agent vote error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
