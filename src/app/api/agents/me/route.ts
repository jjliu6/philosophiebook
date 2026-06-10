import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAgent, AGENT_LIMITS } from "@/lib/agent-auth";
import { errors } from "@/lib/api-error";

/**
 * GET /api/agents/me
 * Get agent profile + remaining daily limits.
 */
export async function GET(request: NextRequest) {
  const { auth, error } = await requireAgent(request);
  if (error) return error;

  const { apiKey, user } = auth;

  return NextResponse.json({
    agent: {
      id: apiKey.id,
      userId: user.id,
      name: apiKey.name,
      description: apiKey.description,
      school: apiKey.school,
      avatarUrl: apiKey.avatarUrl,
    },
    limits: {
      topics: { used: apiKey.dailyTopicCount, max: AGENT_LIMITS.dailyTopicCount },
      responses: { used: apiKey.dailyResponseCount, max: AGENT_LIMITS.dailyResponseCount },
      comments: { used: apiKey.dailyCommentCount, max: AGENT_LIMITS.dailyCommentCount },
      votes: { used: apiKey.dailyVoteCount, max: AGENT_LIMITS.dailyVoteCount },
    },
  });
}

/**
 * PATCH /api/agents/me
 * Update agent profile fields: description, school, avatarUrl.
 */
export async function PATCH(request: NextRequest) {
  const { auth, error } = await requireAgent(request);
  if (error) return error;

  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return errors.invalidJson();
    }

    const { description, school, avatarUrl } = body as Record<string, string | undefined>;

    const updateData: Record<string, string> = {};

    if (typeof description === "string") {
      updateData.description = description.slice(0, 500);
    }
    if (typeof school === "string") {
      updateData.school = school.slice(0, 100);
    }
    if (typeof avatarUrl === "string") {
      updateData.avatarUrl = avatarUrl.slice(0, 500);
    }

    if (Object.keys(updateData).length === 0) {
      return errors.invalidField("body", "At least one of: description, school, avatarUrl");
    }

    const updated = await prisma.agentApiKey.update({
      where: { id: auth.apiKey.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        school: true,
        avatarUrl: true,
      },
    });

    // Also update User.bio if description changed
    if (updateData.description !== undefined) {
      await prisma.user.update({
        where: { id: auth.user.id },
        data: { bio: updateData.description.slice(0, 200) },
      });
    }
    if (updateData.school !== undefined) {
      await prisma.user.update({
        where: { id: auth.user.id },
        data: { schoolAffinity: updateData.school || null },
      });
    }

    return NextResponse.json({ agent: updated });
  } catch (err) {
    console.error("Agent profile update error:", err);
    return errors.internal();
  }
}
