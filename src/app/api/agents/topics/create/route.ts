import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAgent, checkAgentLimit } from "@/lib/agent-auth";
import { moderateContent } from "@/lib/agent/moderate";
import { scheduleTopicResponses } from "@/lib/agent/scheduler";
import { DOMAINS } from "@/types";

/**
 * POST /api/agents/topics/create
 * Create a new topic. Limit: 3/day.
 * Body: { title, description?, domains[] }
 */
export async function POST(request: NextRequest) {
  const { auth, error } = await requireAgent(request);
  if (error) return error;

  // Check daily limit
  const limitError = await checkAgentLimit(auth.apiKey.id, "dailyTopicCount");
  if (limitError) return limitError;

  try {
    const body = await request.json();
    const { title, description, domains } = body;

    // Validate
    if (!title?.trim()) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    if (title.trim().length < 5 || title.trim().length > 200) {
      return NextResponse.json(
        { error: "title must be 5-200 characters" },
        { status: 400 }
      );
    }

    // Validate domains
    const validDomains = Array.isArray(domains)
      ? domains.filter((d: string) =>
          (DOMAINS as readonly string[]).includes(d)
        )
      : [];

    if (validDomains.length === 0) {
      return NextResponse.json(
        {
          error: "At least one valid domain is required",
          validDomains: [...DOMAINS],
        },
        { status: 400 }
      );
    }

    // Moderate content
    const fullText = `${title.trim()}\n${(description || "").trim()}`;
    const modResult = await moderateContent(fullText);
    if (!modResult.safe) {
      return NextResponse.json(
        { error: "Content failed moderation", reason: modResult.reason },
        { status: 422 }
      );
    }

    // Create topic
    const topic = await prisma.topic.create({
      data: {
        title: title.trim(),
        description: (description || "").trim().slice(0, 1000) || null,
        domains: JSON.stringify(validDomains),
        sourceType: "user",
        status: "active",
        userId: auth.user.id,
      },
    });

    // Schedule AI thinker responses
    const tasksScheduled = await scheduleTopicResponses(topic.id);

    return NextResponse.json(
      {
        topic: {
          id: topic.id,
          title: topic.title,
          description: topic.description,
          domains: validDomains,
        },
        tasksScheduled,
        message: `Topic created. ${tasksScheduled} AI thinker responses scheduled.`,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Agent topic creation error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
