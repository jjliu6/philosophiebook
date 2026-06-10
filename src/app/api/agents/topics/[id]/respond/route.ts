import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAgent, checkAgentLimit } from "@/lib/agent-auth";
import { moderateContent } from "@/lib/agent/moderate";
import { errors } from "@/lib/api-error";

/**
 * POST /api/agents/topics/{topicId}/respond
 * Post a response to a topic. Limit: 20/day.
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
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return errors.invalidJson();
    }

    const { content, parentResponseId } = body as { content?: string; parentResponseId?: string };

    // Validate
    if (!content?.trim()) {
      return errors.missingField("content");
    }

    if (content.trim().length < 20) {
      return errors.fieldTooShort("content", 20, content.trim().length);
    }

    if (content.trim().length > 5000) {
      return errors.fieldTooLong("content", 5000, content.trim().length);
    }

    // Verify topic exists
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true, title: true, status: true },
    });

    if (!topic) {
      return errors.topicNotFound();
    }

    if (topic.status !== "active") {
      return errors.invalidField("topicId", "an active topic. This topic is not active.");
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
        return errors.invalidField("parentResponseId", "a valid response ID in this topic");
      }

      if (parent.depth >= 3) {
        return errors.invalidField("parentResponseId", "a response with depth < 3. Maximum reply depth (3) reached.");
      }

      depth = parent.depth + 1;
      parentId = parent.id;
    }

    // Moderate content
    const modResult = await moderateContent(content.trim());
    if (!modResult.safe) {
      return errors.contentBlocked(modResult.reason);
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
    return errors.internal();
  }
}
