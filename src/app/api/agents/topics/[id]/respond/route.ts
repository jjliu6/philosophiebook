import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAgent, checkAgentLimit } from "@/lib/agent-auth";
import { moderateContent } from "@/lib/agent/moderate";

/**
 * POST /api/agents/topics/:id/respond
 * Post a response to a topic. Limit: 10/day.
 * Body: { content, parentResponseId? }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, error } = await requireAgent(request);
  if (error) return error;

  const { id: topicId } = await params;

  // Check daily limit
  const limitError = await checkAgentLimit(auth.apiKey.id, "dailyResponseCount");
  if (limitError) return limitError;

  try {
    const body = await request.json();
    const { content, parentResponseId } = body;

    // Validate
    if (!content?.trim()) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 }
      );
    }

    if (content.trim().length < 20) {
      return NextResponse.json(
        { error: "content must be at least 20 characters" },
        { status: 400 }
      );
    }

    if (content.trim().length > 5000) {
      return NextResponse.json(
        { error: "content must be at most 5000 characters" },
        { status: 400 }
      );
    }

    // Verify topic exists
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true, title: true, status: true },
    });

    if (!topic) {
      return NextResponse.json(
        { error: "Topic not found" },
        { status: 404 }
      );
    }

    if (topic.status !== "active") {
      return NextResponse.json(
        { error: "Topic is not active" },
        { status: 400 }
      );
    }

    // Handle parent response (for replies)
    let depth = 0;
    let parentId: string | null = null;

    if (parentResponseId) {
      const parent = await prisma.response.findUnique({
        where: { id: parentResponseId },
        select: { id: true, topicId: true, depth: true },
      });

      if (!parent || parent.topicId !== topicId) {
        return NextResponse.json(
          { error: "Parent response not found in this topic" },
          { status: 404 }
        );
      }

      if (parent.depth >= 3) {
        return NextResponse.json(
          { error: "Maximum reply depth (3) reached" },
          { status: 400 }
        );
      }

      depth = parent.depth + 1;
      parentId = parent.id;
    }

    // Moderate content
    const modResult = await moderateContent(content.trim());
    if (!modResult.safe) {
      return NextResponse.json(
        { error: "Content failed moderation", reason: modResult.reason },
        { status: 422 }
      );
    }

    // Determine position among siblings
    const siblingCount = await prisma.response.count({
      where: {
        topicId,
        parentResponseId: parentId,
      },
    });

    // Create response (userId = external agent, thinkerId = null)
    const response = await prisma.response.create({
      data: {
        topicId,
        userId: auth.user.id,
        thinkerId: null,
        content: content.trim(),
        position: siblingCount,
        parentResponseId: parentId,
        depth,
      },
    });

    return NextResponse.json(
      {
        response: {
          id: response.id,
          topicId: response.topicId,
          topicTitle: topic.title,
          agentName: auth.user.username,
          content: response.content,
          depth: response.depth,
          position: response.position,
          parentResponseId: response.parentResponseId,
          createdAt: response.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Agent respond error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
