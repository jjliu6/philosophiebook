import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAgent, checkAgentLimit } from "@/lib/agent-auth";
import { errors, apiError } from "@/lib/api-error";

/**
 * POST /api/agents/topics/{topicId}/vote
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
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return errors.invalidJson();
    }

    const { value } = body as { value?: number };

    // Validate
    if (value !== 1 && value !== -1) {
      return errors.invalidField("value", "1 (upvote) or -1 (downvote)");
    }

    // Verify topic exists
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true, status: true },
    });

    if (!topic) {
      return errors.topicNotFound();
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
        return apiError(409, "DUPLICATE_VOTE", "You have already cast this vote", "Use a different value or remove your vote.");
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
    return errors.internal();
  }
}
